import type { AnimationRenderer } from ".././display/types";

export const waveMetadata = {
  id: "wave",
  name: "Wave animation",
  description: "A sine wave that moves across the screen",
  thumbnail: "/api/thumbnail/wave",
  status: "Available" as const,
};

export const waveAnimation: AnimationRenderer = (ctx, frame, config) => {
  if (!ctx) return;
  const { width, height } = config;
  const { elapsedTime } = frame;

  ctx.fillStyle = "#fff";

  // Draw a sine wave
  const amplitude = height / 3;
  const frequency = 0.05;
  const speed = 0.002;

  for (let x = 0; x < width; x++) {
    const y =
      height / 2 + Math.sin(x * frequency + elapsedTime * speed) * amplitude;

    // Draw a small circle at each point
    ctx.beginPath();
    ctx.arc(x, Math.floor(y), 1, 0, Math.PI * 2);
    ctx.fill();
  }
};

export function wave(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number
) {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  for (let x = 0; x < width; x++) {
    const y = height / 2 + Math.sin((x + frame) * 0.1) * (height / 4);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}