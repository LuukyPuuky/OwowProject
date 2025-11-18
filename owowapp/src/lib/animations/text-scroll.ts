import type { AnimationRenderer } from ".././display/types";

export const textScrollMetadata = {
  id: "text-scroll",
  name: "Text scroll",
  description: "Scrolling text message across the display",
  thumbnail: "/api/thumbnail/text-scroll",
  status: "Available" as const,
};

export const textScrollAnimation: AnimationRenderer = (ctx, frame, config) => {
  if (!ctx) return;
  const { width, height } = config;
  const { elapsedTime } = frame;

  const text = "HELLO WORLD! ";

  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";

  // Calculate scroll position
  const scrollSpeed = 0.05;
  const textWidth = ctx.measureText(text).width;
  const offset = (elapsedTime * scrollSpeed) % (textWidth + width);

  // Draw text scrolling from right to left
  const x = width - offset;
  const y = height / 2 - 6;

  ctx.fillText(text, Math.floor(x), Math.floor(y));

  // Draw second copy for seamless loop
  if (x < 0) {
    ctx.fillText(text, Math.floor(x + textWidth), Math.floor(y));
  }
};

export function textScroll(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number
) {
  ctx.fillStyle = "#fff";
  ctx.font = "8px monospace";
  ctx.textBaseline = "middle";
  
  const text = "HELLO";
  const x = width - ((frame % (width + 80)) - 80);
  const y = height / 2;
  
  ctx.fillText(text, x, y);
}