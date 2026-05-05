import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.js";

const { validateInput, generateSummaryStats, publishResult } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 seconds",
});

export async function DcrSummaryStatsWorkflow(input: activities.SummaryStatsInput): Promise<string> {
  await validateInput(input);
  await generateSummaryStats(input);
  await publishResult(input);
  return `summary stats complete for ${input.measurementId}`;
}
