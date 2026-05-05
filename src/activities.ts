export type SummaryStatsInput = {
  measurementId: string;
  source: string;
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function validateInput(input: SummaryStatsInput): Promise<string> {
  await pause(150);
  return `validateInput ok for ${input.measurementId}`;
}

export async function generateSummaryStats(input: SummaryStatsInput): Promise<string> {
  await pause(150);
  return `generateSummaryStats ok for ${input.source}`;
}

export async function publishResult(input: SummaryStatsInput): Promise<string> {
  await pause(150);
  return `publishResult ok for ${input.measurementId}`;
}
