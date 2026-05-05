import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.js";

const { validateInput, runBusinessTask, publishResult } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
});

export async function OneShotDemoWorkflow(input: activities.OneShotInput): Promise<string> {
  await validateInput(input);
  await runBusinessTask(input);
  await publishResult(input);
  return `one-shot job complete for ${input.requestId}`;
}
