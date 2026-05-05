import assert from "node:assert/strict";
import { MockTemporalClient } from "./mockTemporal.js";
import { buildOneShotSpec, scheduleOnce } from "./oneshot.js";

async function run(): Promise<void> {
  testBuildsSyntheticOneShotSpec();
  testRejectsInvalidRunAt();
  testRejectsBlankWorkflowFields();
  await testScheduleOnceUsesClient();
  console.log("✅ 4 OneShot tests passed");
}

function testBuildsSyntheticOneShotSpec(): void {
  const runAt = new Date("2026-05-10T10:00:00.123Z");

  const spec = buildOneShotSpec({
    workflowType: "OneShotDemoWorkflow",
    workflowId: "request-123",
    taskQueue: "oneshot-task-queue",
    runAt,
  });

  assert.equal(spec.syntheticInterval.everyMs, 1000);
  assert.equal(spec.syntheticInterval.offsetMs, 123);
  assert.equal(spec.window.startAtIso, "2026-05-10T10:00:00.123Z");
  assert.equal(spec.window.endAtIso, "2026-05-10T10:00:00.124Z");
  assert.equal(spec.window.windowMs, 1);
  assert.equal(spec.expectedFireCount, 1);
}

function testRejectsInvalidRunAt(): void {
  assert.throws(
    () =>
      buildOneShotSpec({
        workflowType: "OneShotDemoWorkflow",
        workflowId: "request-123",
        taskQueue: "oneshot-task-queue",
        runAt: new Date("not-a-date"),
      }),
    /runAt is not a valid date/,
  );
}

function testRejectsBlankWorkflowFields(): void {
  assert.throws(
    () =>
      buildOneShotSpec({
        workflowType: "",
        workflowId: "request-123",
        taskQueue: "oneshot-task-queue",
        runAt: new Date(Date.now() + 10_000),
      }),
    /workflowType must be non-empty/,
  );
}

async function testScheduleOnceUsesClient(): Promise<void> {
  const input = {
    workflowType: "OneShotDemoWorkflow",
    workflowId: "request-123",
    taskQueue: "oneshot-task-queue",
    runAt: new Date(Date.now() + 10_000),
  };

  const result = await scheduleOnce(input, new MockTemporalClient());

  assert.equal(result.scheduleId, "oneshot-request-123");
  assert.equal(result.nextFireTime, input.runAt.toISOString());
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
