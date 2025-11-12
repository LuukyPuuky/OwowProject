import type { AnimationRenderer } from ".././display/types";

export const starBounceMetadata = {
  id: "1",
  name: "Star animation",
  description: "Displays a star that moves in different directions",
  status: "Equiped" as const,
};

export const starBounceAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { width, height } = config;
  const { elapsedTime } = frame;

  // Draw a bouncing star
  const size = 8;
  const w = width - size;
  const sine = Math.sin(elapsedTime / 1000);
  const x = Math.floor(((sine + 1) / 2) * w);
  const y = height / 2 - size / 2;

  if (!ctx) return;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
};
