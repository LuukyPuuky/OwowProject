import type { AnimationRenderer } from ".././display/types";

// Generate a thumbnail showing a sine wave
const generateWaveThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  const amplitude = height / 3;
  const frequency = 0.08;
  
  for (let x = 0; x < width; x++) {
    const y = Math.floor(height / 2 + Math.sin(x * frequency) * amplitude);
    if (y >= 0 && y < height) {
      pixels[y * width + x] = true;
      // Make wave slightly thicker for visibility
      if (y > 0) pixels[(y - 1) * width + x] = true;
      if (y < height - 1) pixels[(y + 1) * width + x] = true;
    }
  }
  
  return pixels;
};

export const waveMetadata = {
  id: "wave",
  name: "Wave",
  description: "A sine wave that moves across the screen",
  status: "Available" as const,
  thumbnail: generateWaveThumbnail(),
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
