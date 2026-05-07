# Temporal OneShot

Fire once. Exactly once. Without schedule-spec hacks leaking into app code.

## Problem

Temporal schedules are powerful, but one-time delayed scheduling can be unintuitive when schedule specs need interval information to compute upcoming runs. Developers usually want to say "run this workflow once at this timestamp" without hand-building interval grids, phase offsets, and tiny windows.

## Solution

Temporal OneShot exposes a clean `scheduleOnce()` style API and internally generates a safe synthetic one-shot schedule spec:

- `every = 1000ms`
- `offset = runAt milliseconds % 1000`
- `startAt = runAt`
- `endAt = runAt + 1ms`

The result is a tiny aligned schedule window where only one matching tick can occur.

## Demo

```bash
npm install
npm run demo
```

Bonus validation demo:

```bash
npm run demo:invalid
```

Live Temporal demo:

```bash
docker run --rm --name temporal-oneshot-dev -p 7233:7233 -p 8233:8233 temporalio/temporal:latest server start-dev --ip 0.0.0.0
npm run demo:live
```

The live demo creates a real Temporal Schedule, starts a TypeScript worker, waits for the scheduled workflow execution, and confirms the schedule consumed its single remaining action. Temporal UI is available at `http://localhost:8233`.

## Example API

```ts
await scheduleOnce({
  workflowType: "OneShotDemoWorkflow",
  workflowId: "request-123",
  taskQueue: "oneshot-task-queue",
  runAt: new Date("2026-05-10T10:00:00.123Z"),
});
```

## Big Point

> Temporal OneShot makes delayed fire-once workflows simple and safe. Instead of requiring developers to reason about interval grids, offsets, and tiny execution windows, it provides a clean API that creates a validated one-time schedule, previews the generated spec, and demonstrates exactly one workflow execution.

## Future Work

- Schedule preview with next N fire times
- Web playground
- GitHub Action validator for schedule specs
- Support for automatic cleanup after fire
