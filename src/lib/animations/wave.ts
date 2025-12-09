import type { AnimationRenderer } from ".././display/types";

// Static thumbnail: simple sine wave across the canvas
const generateWaveThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  const amplitude = height / 3;
  const frequency = 0.25;
  const centerY = height / 2;

  for (let x = 0; x < width; x++) {
    const y = Math.floor(centerY + Math.sin(x * frequency) * amplitude);
    const idx = y * width + x;
    if (idx >= 0 && idx < pixels.length) {
      pixels[idx] = true;
      // Thicken the line slightly for visibility
      if (y + 1 < height) pixels[(y + 1) * width + x] = true;
    }
  }

  return pixels;
};

export const waveMetadata = {
  id: "wave",
  name: "Wave",
  description: "A wave that moves across the screen",
  thumbnail: generateWaveThumbnail(),
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
