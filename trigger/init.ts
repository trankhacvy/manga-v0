import { tasks, logger } from "@trigger.dev/sdk";

// Global lifecycle hooks for all tasks
tasks.onStartAttempt(({ ctx, payload, task }) => {
  logger.info(`Task ${task} started - Payload : ${JSON.stringify(payload)}`, {
    runId: ctx.run.id,
    taskId: task,
  });
});

tasks.onSuccess(({ ctx, output, task }) => {
  logger.info(`Task ${task} succeeded`, {
    runId: ctx.run.id,
    taskId: task,
  });
});

tasks.onFailure(({ ctx, error, task }) => {
  logger.error(`Task ${task} failed`, {
    runId: ctx.run.id,
    taskId: task,
    // @ts-expect-error
    error: error?.message,
  });
});

tasks.onCancel(({ ctx, signal }) => {
  logger.warn(`Task cancelled`, {
    runId: ctx.run.id,
  });
});
