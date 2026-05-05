export type ScheduleOnceInput = {
  workflowType: string;
  workflowId: string;
  taskQueue: string;
  runAt: Date;
  args?: unknown[];
};

export type OneShotSpec = {
  workflowType: string;
  workflowId: string;
  taskQueue: string;
  runAtIso: string;
  syntheticInterval: {
    everyMs: number;
    offsetMs: number;
  };
  window: {
    startAtIso: string;
    endAtIso: string;
    windowMs: number;
  };
  expectedFireCount: 1;
};

export type OneShotScheduleResult = {
  scheduleId: string;
  nextFireTime: string;
};

export type TemporalScheduleClient = {
  createSchedule(spec: OneShotSpec): Promise<OneShotScheduleResult>;
};

const ONE_SECOND_MS = 1000;
const ONE_SHOT_WINDOW_MS = 1;
const MAX_PAST_DRIFT_MS = 5 * 60 * 1000;

export function buildOneShotSpec(input: ScheduleOnceInput): OneShotSpec {
  validateScheduleOnceInput(input);

  const runAtMs = input.runAt.getTime();
  const offsetMs = ((runAtMs % ONE_SECOND_MS) + ONE_SECOND_MS) % ONE_SECOND_MS;
  const endAt = new Date(runAtMs + ONE_SHOT_WINDOW_MS);

  return {
    workflowType: input.workflowType.trim(),
    workflowId: input.workflowId.trim(),
    taskQueue: input.taskQueue.trim(),
    runAtIso: input.runAt.toISOString(),
    syntheticInterval: {
      everyMs: ONE_SECOND_MS,
      offsetMs,
    },
    window: {
      startAtIso: input.runAt.toISOString(),
      endAtIso: endAt.toISOString(),
      windowMs: ONE_SHOT_WINDOW_MS,
    },
    expectedFireCount: 1,
  };
}

export async function scheduleOnce(
  input: ScheduleOnceInput,
  client: TemporalScheduleClient,
): Promise<OneShotScheduleResult> {
  const spec = buildOneShotSpec(input);
  return client.createSchedule(spec);
}

export function explainOneShotSpec(spec: OneShotSpec): string {
  return [
    "Temporal OneShot Plan",
    `Workflow: ${spec.workflowType}`,
    `Workflow ID: ${spec.workflowId}`,
    `Task Queue: ${spec.taskQueue}`,
    `Run At: ${spec.runAtIso}`,
    "",
    "Generated synthetic schedule spec:",
    `- every: ${spec.syntheticInterval.everyMs}ms`,
    `- offset: ${spec.syntheticInterval.offsetMs}ms`,
    `- window: ${spec.window.windowMs}ms`,
    "- expected fires: exactly 1",
    "",
    "Why this works:",
    "Temporal receives a tiny interval window aligned to the requested timestamp, so only one matching tick can occur.",
  ].join("\n");
}

function validateScheduleOnceInput(input: ScheduleOnceInput): void {
  assertNonEmpty(input.workflowType, "workflowType");
  assertNonEmpty(input.workflowId, "workflowId");
  assertNonEmpty(input.taskQueue, "taskQueue");

  if (!(input.runAt instanceof Date) || Number.isNaN(input.runAt.getTime())) {
    throw new Error(
      "runAt is not a valid date. Suggestion: provide an ISO timestamp, for example 2026-05-10T10:00:00.123Z",
    );
  }

  const tooFarInPast = Date.now() - input.runAt.getTime() > MAX_PAST_DRIFT_MS;
  if (tooFarInPast) {
    throw new Error("runAt should not be more than 5 minutes in the past.");
  }
}

function assertNonEmpty(value: string, fieldName: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be non-empty.`);
  }
}
