import type { AnimationRenderer } from ".././display/types";

export const timerMetadata = {
  id: "timer",
  name: "Timer animation",
  description: "Displays elapsed time in seconds",
  status: "Available" as const,
};

export const timerAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { elapsedTime } = frame;
  const text = (elapsedTime / 1000).toFixed(2);

  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.font = "14px monospace";

  const metrics = ctx.measureText(text);
  ctx.fillText(text, 2, 2);
};
