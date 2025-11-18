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

export function timer(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number
) {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const seconds = Math.floor(frame / 30) % 60;
  ctx.fillText(seconds.toString().padStart(2, "0"), width / 2, height / 2);
}