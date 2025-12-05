import type { AnimationRenderer } from ".././display/types";

// Generate a thumbnail for the logo
const generateLogoThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  // Simple "OWOW" pattern - centered
  // O at x=20-25, W at x=30-37, O at x=42-47, W at x=52-59
  const patterns = {
    O: [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]], // 3x5
    W: [[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1]], // 5x5
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
  drawLetter(patterns.O, 20, yOffset);
  drawLetter(patterns.W, 26, yOffset);
  drawLetter(patterns.O, 34, yOffset);
  drawLetter(patterns.W, 40, yOffset);
  
  return pixels;
};

export const logoMetadata = {
  id: "logo",
  name: "Logo",
  description: "Displays the OWOW logo",
  status: "Available" as const,
  thumbnail: generateLogoThumbnail(),
};

export const logoAnimation: AnimationRenderer = (ctx, frame, config) => {
  const { width, height } = config;
  const text = "OWOW";

  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, width / 2, height / 2);
};
