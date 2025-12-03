import type { AnimationRenderer } from ".././display/types";

// Generate a thumbnail showing "HELLO"
const generateTextScrollThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  // Letter patterns (5x5 each)
  const letters: { [key: string]: number[][] } = {
    H: [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    E: [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]],
    L: [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    O: [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  };
  
  const drawLetter = (pattern: number[][], startX: number, startY: number) => {
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
  const text = "HELLO";
  let xPos = 15;
  
  for (const char of text) {
    if (letters[char]) {
      drawLetter(letters[char], xPos, yOffset);
      xPos += 5; // 3 for letter + 2 for spacing
    }
  }
  
  return pixels;
};

export const textScrollMetadata = {
  id: "text-scroll",
  name: "Text scroll",
  description: "Scrolling text message across the display",
  status: "Available" as const,
  thumbnail: generateTextScrollThumbnail(),
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
  const spacing = 30;
  const textWidth = ctx.measureText(text).width;
  const totalWidth = textWidth + spacing;
  const offset = (elapsedTime * scrollSpeed) % totalWidth;

  // Draw text scrolling from right to left
  const x = width - offset;
  const y = (height - 16) / 2;

  // Draw multiple copies to ensure seamless infinite loop
  ctx.fillText(text, Math.floor(x), Math.floor(y));
  ctx.fillText(text, Math.floor(x + totalWidth), Math.floor(y));
  ctx.fillText(text, Math.floor(x - totalWidth), Math.floor(y));
};
