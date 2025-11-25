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

  const text = "HELLO WORLD!";

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px monospace";

  // Calculate scroll position
  const scrollSpeed = 0.05;
  const spacing = 30; // Add space between text copies
  const textWidth = ctx.measureText(text).width;
  const totalWidth = textWidth + spacing;
  const offset = (elapsedTime * scrollSpeed) % totalWidth;

  // Draw text scrolling from right to left
  const x = width - offset;
  const y = (height - 16) / 2; // Center vertically

  // Draw multiple copies to ensure seamless infinite loop
  ctx.fillText(text, Math.floor(x), Math.floor(y));
  ctx.fillText(text, Math.floor(x + totalWidth), Math.floor(y));
  ctx.fillText(text, Math.floor(x - totalWidth), Math.floor(y));
};
