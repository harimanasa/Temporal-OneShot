import { explainOneShotSpec, scheduleOnce } from "./oneshot.js";
import {
  LiveTemporalScheduleClient,
  buildLiveDemoInput,
  buildLiveSpec,
  connectTemporal,
  createLiveWorker,
  waitForWorkflowResult,
} from "./liveTemporal.js";

async function main(): Promise<void> {
  console.log("🚀 Temporal OneShot Live Demo");
  console.log("");
  console.log("Connecting to Temporal at localhost:7233...");

  const input = buildLiveDemoInput();
  const spec = buildLiveSpec(input);
  const { client, connection, nativeConnection } = await connectTemporal();
  const worker = await createLiveWorker(nativeConnection, input.taskQueue);

  console.log("✅ Connected");
  console.log("");
  console.log(explainOneShotSpec(spec));
  console.log("");

  const workerRun = worker.run();
  try {
    const scheduleClient = new LiveTemporalScheduleClient(client);
    const created = await scheduleOnce(input, scheduleClient);
    console.log("✅ Live Temporal schedule created");
    console.log(`Schedule ID: ${created.scheduleId}`);
    console.log(`Next fire time: ${created.nextFireTime}`);
    console.log("");
    console.log("⏳ Waiting for Temporal to fire the schedule...");

    const { workflowId, result } = await waitForWorkflowResult(client, created.scheduleId);
    console.log(`🔥 Temporal fired workflow: ${input.workflowType}`);
    console.log(`📦 Workflow ID: ${workflowId}`);
    console.log(`🎉 Workflow result: ${result}`);
    console.log("🧹 OneShot schedule consumed its single remaining action");
  } finally {
    worker.shutdown();
    await workerRun;
    await nativeConnection.close();
    await connection.close();
  }
}

main().catch((error) => {
  console.error("❌ Live demo failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
