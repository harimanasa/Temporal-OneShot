import { Client, Connection, ScheduleAlreadyRunning, ScheduleOverlapPolicy } from "@temporalio/client";
import { DefaultLogger, NativeConnection, Runtime, Worker } from "@temporalio/worker";
import { fileURLToPath } from "node:url";
import * as activities from "./activities.js";
import {
  buildOneShotSpec,
  type OneShotScheduleResult,
  type OneShotSpec,
  type ScheduleOnceInput,
  type TemporalScheduleClient,
} from "./oneshot.js";

export type LiveTemporalOptions = {
  address?: string;
  namespace?: string;
};

export class LiveTemporalScheduleClient implements TemporalScheduleClient {
  constructor(private readonly client: Client) {}

  async createSchedule(spec: OneShotSpec): Promise<OneShotScheduleResult> {
    const scheduleId = `oneshot-${spec.workflowId}`;

    try {
      await this.client.schedule.getHandle(scheduleId).delete();
    } catch {
      // Idempotent reruns are friendlier for a hackathon demo.
    }

    try {
      const handle = await this.client.schedule.create({
        scheduleId,
        spec: {
          intervals: [
            {
              every: spec.syntheticInterval.everyMs,
              offset: spec.syntheticInterval.offsetMs,
            },
          ],
          startAt: new Date(spec.window.startAtIso),
          endAt: new Date(spec.window.endAtIso),
          timezone: "UTC",
        },
        action: {
          type: "startWorkflow",
          workflowType: spec.workflowType,
          workflowId: spec.workflowId,
          taskQueue: spec.taskQueue,
          args: [{ measurementId: "demo-measurement-001", source: "temporal-live" }],
        },
        policies: {
          overlap: ScheduleOverlapPolicy.SKIP,
          catchupWindow: "1 minute",
        },
        state: {
          remainingActions: 1,
        },
      });
      const description = await handle.describe();
      return {
        scheduleId,
        nextFireTime: description.info.nextActionTimes[0]?.toISOString() ?? spec.runAtIso,
      };
    } catch (error) {
      if (error instanceof ScheduleAlreadyRunning) {
        return { scheduleId, nextFireTime: spec.runAtIso };
      }
      throw error;
    }
  }
}

export async function connectTemporal(options: LiveTemporalOptions = {}): Promise<{
  client: Client;
  connection: Connection;
  nativeConnection: NativeConnection;
}> {
  installQuietRuntime();
  const address = options.address ?? "localhost:7233";
  const namespace = options.namespace ?? "default";
  const connection = await Connection.connect({ address });
  const nativeConnection = await NativeConnection.connect({ address });
  return {
    client: new Client({ connection, namespace }),
    connection,
    nativeConnection,
  };
}

export async function createLiveWorker(
  nativeConnection: NativeConnection,
  taskQueue: string,
  namespace = "default",
): Promise<Worker> {
  installQuietRuntime();

  return Worker.create({
    connection: nativeConnection,
    namespace,
    taskQueue,
    workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
    activities,
    bundlerOptions: {
      webpackConfigHook: (config) => ({
        ...config,
        stats: "errors-only",
      }),
    },
  });
}

function installQuietRuntime(): void {
  try {
    Runtime.install({
      logger: new DefaultLogger("ERROR"),
      telemetryOptions: {
        logging: {
          filter: {
            core: "ERROR",
            other: "ERROR",
          },
        },
      },
    });
  } catch {
    // Runtime can only be installed once per process.
  }
}

export async function waitForWorkflowResult(
  client: Client,
  scheduleId: string,
  timeoutMs = 30_000,
): Promise<{ workflowId: string; result: string }> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const description = await client.schedule.getHandle(scheduleId).describe();
      const workflowId = description.info.recentActions
        .slice()
        .reverse()
        .find((action) => action.action.type === "startWorkflow")
        ?.action.workflow.workflowId;

      if (!workflowId) {
        await sleep(500);
        continue;
      }

      const handle = client.workflow.getHandle(workflowId);
      const result = await Promise.race([
        handle.result(),
        sleep(1_000).then(() => undefined),
      ]);
      if (typeof result === "string") {
        return { workflowId, result };
      }
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  throw new Error(`Timed out waiting for schedule ${scheduleId}. Last error: ${String(lastError)}`);
}

export function buildLiveDemoInput(): ScheduleOnceInput {
  const runAtMs = Math.ceil((Date.now() + 8_000) / 1_000) * 1_000;
  return {
    workflowType: "DcrSummaryStatsWorkflow",
    workflowId: `summary-stats-live-${runAtMs}`,
    taskQueue: "measurement-queue-live",
    runAt: new Date(runAtMs),
    args: [{ measurementId: "demo-measurement-001", source: "temporal-live" }],
  };
}

export function buildLiveSpec(input: ScheduleOnceInput): OneShotSpec {
  return buildOneShotSpec(input);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
