import type { AnimationRenderer } from ".././display/types";

// Generate a thumbnail showing "0.00"
const generateTimerThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  const patterns = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]], // 3x5
    '.': [[0],[0],[0],[0],[1]], // 1x5, only bottom pixel
  };
  
  const drawChar = (pattern: number[][], startX: number, startY: number) => {
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
  
  // "0.00" layout
  // 0: x=32
  drawChar(patterns['0'], 32, yOffset);
  // .: x=36 (32 + 3 + 1 spacing)
  drawChar(patterns['.'], 36, yOffset);
  // 0: x=38 (36 + 1 + 1 spacing)
  drawChar(patterns['0'], 38, yOffset);
  // 0: x=42 (38 + 3 + 1 spacing)
  drawChar(patterns['0'], 42, yOffset);
  
  return pixels;
};

export const timerMetadata = {
  id: "timer",
  name: "Timer",
  description: "Displays elapsed time in seconds",
  status: "Available" as const,
  thumbnail: generateTimerThumbnail(),
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
