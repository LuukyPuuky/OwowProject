import type { AnimationRenderer } from ".././display/types";

export const timerMetadata = {
  id: "timer",
  name: "Timer",
  description: "Displays elapsed time in seconds",
  status: "Available" as const,
};

export const timerAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { elapsedTime } = frame;
  const text = (elapsedTime / 1000).toFixed(2);

  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px monospace";

  const metrics = ctx.measureText(text);
  const x = (config.width - metrics.width) / 2;
  const y = (config.height - 16) / 2;

  ctx.fillText(text, Math.floor(x), Math.floor(y));
};
