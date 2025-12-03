import type { AnimationRenderer } from ".././display/types";

// Generate a thumbnail showing "00:00"
const generateTimerThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  // Digital-style "00:00" pattern
  const digit = [
    [1,1,1],
    [1,0,1],
    [1,0,1],
    [1,0,1],
    [1,1,1]
  ];
  
  const colon = [
    [0],
    [1],
    [0],
    [1],
    [0]
  ];
  
  const drawPattern = (pattern: number[][], startX: number, startY: number) => {
    pattern.forEach((row, y) => {
      row.forEach((pixel, x) => {
        if (pixel) {
          const idx = (startY + y) * width + (startX + x);
          if (idx >= 0 && idx < pixels.length) pixels[idx] = true;
        }
      });
    });
  };
  
  const yOffset = 7; // Center vertically
  drawPattern(digit, 25, yOffset); // First 0
  drawPattern(digit, 30, yOffset); // Second 0
  drawPattern(colon, 35, yOffset); // Colon
  drawPattern(digit, 38, yOffset); // Third 0
  drawPattern(digit, 43, yOffset); // Fourth 0
  
  return pixels;
};

export const timerMetadata = {
  id: "timer",
  name: "Timer",
  description: "Displays elapsed time in seconds",
  status: "Available" as const,
  thumbnail: generateTimerThumbnail(),
};

export const timerAnimation: AnimationRenderer = (ctx, frame) => {
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
