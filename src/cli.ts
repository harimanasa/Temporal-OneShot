import { MockTemporalClient } from "./mockTemporal.js";
import {
  buildOneShotSpec,
  explainOneShotSpec,
  scheduleOnce,
  type ScheduleOnceInput,
} from "./oneshot.js";

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "demo";

  if (mode === "invalid") {
    runInvalidDemo();
    return;
  }

  await runDemo();
}

async function runDemo(): Promise<void> {
  console.log("🚀 Temporal OneShot Demo");
  console.log("");
  console.log("Creating fire-once schedule...");
  console.log("");

  const input: ScheduleOnceInput = {
    workflowType: "OneShotDemoWorkflow",
    workflowId: "request-demo-001",
    taskQueue: "oneshot-task-queue",
    runAt: new Date(Date.now() + 10_123),
    args: [{ requestId: "demo-request-001" }],
  };

  const spec = buildOneShotSpec(input);
  const client = new MockTemporalClient();

  console.log(explainOneShotSpec(spec));
  console.log("");

  const created = await scheduleOnce(input, client);
  console.log("✅ Schedule created");
  console.log(`Schedule ID: ${created.scheduleId}`);
  console.log(`Next fire time: ${created.nextFireTime}`);
  console.log("");

  await client.simulateFire(spec);
}

function runInvalidDemo(): void {
  try {
    buildOneShotSpec({
      workflowType: "OneShotDemoWorkflow",
      workflowId: "request-demo-001",
      taskQueue: "oneshot-task-queue",
      runAt: new Date("not-a-date"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const [reason, suggestion] = message.split(". Suggestion: ");
    console.log("❌ Invalid OneShot schedule");
    console.log(`Reason: ${reason}`);
    if (suggestion) {
      console.log(`Suggestion: ${suggestion}`);
    }
    return;
  }

  throw new Error("Invalid demo unexpectedly passed validation.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
