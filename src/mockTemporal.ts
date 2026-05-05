import type { OneShotSpec, OneShotScheduleResult } from "./oneshot.js";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockTemporalClient {
  async createSchedule(spec: OneShotSpec): Promise<OneShotScheduleResult> {
    await pause(300);
    return {
      scheduleId: `oneshot-${spec.workflowId}`,
      nextFireTime: spec.runAtIso,
    };
  }

  async simulateFire(spec: OneShotSpec): Promise<void> {
    console.log("⏳ Fast-forwarding demo clock...");
    await pause(250);
    console.log(`🔥 OneShot fired: ${spec.workflowType}`);
    await pause(180);
    console.log(`📦 Starting workflow execution: ${spec.workflowId}`);
    await pause(180);
    console.log("✅ Activity completed: validateInput");
    await pause(160);
    console.log("✅ Activity completed: generateSummaryStats");
    await pause(160);
    console.log("✅ Activity completed: publishResult");
    await pause(160);
    console.log("🎉 Workflow completed successfully");
    await pause(120);
    console.log("🧹 OneShot schedule auto-closed after first fire");
  }
}
