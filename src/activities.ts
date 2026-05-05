export type OneShotInput = {
  requestId: string;
  source: string;
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function validateInput(input: OneShotInput): Promise<string> {
  await pause(150);
  return `validateInput ok for ${input.requestId}`;
}

export async function runBusinessTask(input: OneShotInput): Promise<string> {
  await pause(150);
  return `runBusinessTask ok for ${input.source}`;
}

export async function publishResult(input: OneShotInput): Promise<string> {
  await pause(150);
  return `publishResult ok for ${input.requestId}`;
}
