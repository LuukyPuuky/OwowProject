import type { AnimationRenderer } from ".././display/types";

export const logoMetadata = {
  id: "logo",
  name: "Logo animation",
  description: "Displays the OWOW logo",
  status: "Available" as const,
};

export const logoAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { width } = config;
  const text = "OWOW";

  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";

  const metrics = ctx.measureText(text);
  ctx.fillText(text, width - metrics.width - 2, 2);
};

export function logo(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number
) {
  ctx.fillStyle = "#fff";
  const scale = 0.8 + Math.sin(frame * 0.1) * 0.2;
  const size = height * scale;
  const x = (width - size) / 2;
  const y = (height - size) / 2;
  
  ctx.fillRect(x, y, size, size);
}