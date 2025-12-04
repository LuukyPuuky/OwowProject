import "server-only";
import { createCanvas, Canvas } from "canvas";
import type {
  DisplayConfig,
  AnimationFrame,
  AnimationRenderer,
  CanvasContext,
} from "././types";

export class DisplayManager {
  private canvas: Canvas;
  private ctx: CanvasContext;
  private config: DisplayConfig;
  private currentRenderer: AnimationRenderer | null = null;

  constructor(config: DisplayConfig) {
    this.config = config;

    // Use server-side canvas from 'canvas' package
    this.canvas = createCanvas(config.width, config.height);
    this.ctx = this.canvas.getContext("2d") as unknown as CanvasContext;

    // Disable anti-aliasing for pixel-perfect rendering
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.textBaseline = "top";
    }
  }

  setRenderer(renderer: AnimationRenderer) {
    this.currentRenderer = renderer;
  }

  async render(frame: AnimationFrame): Promise<Buffer> {
    const { ctx, config } = this;
    if (!ctx) throw new Error("Canvas context not initialized");

    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);

    // Fill with black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, config.width, config.height);

    // Render current animation
    if (this.currentRenderer) {
      this.currentRenderer(ctx, frame, config);
    }

    // Convert to binary (black and white only)
    const imageData = ctx.getImageData(0, 0, config.width, config.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binary = brightness > 127 ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
      data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to buffer using server-side canvas
    return this.canvas.toBuffer("image/png");
  }

  async renderRaw(frame: AnimationFrame): Promise<Buffer> {
    const { ctx, config } = this;
    if (!ctx) throw new Error("Canvas context not initialized");

    // Clear canvas
    ctx.clearRect(0, 0, config.width, config.height);

    // Fill with black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, config.width, config.height);

    // Render current animation
    if (this.currentRenderer) {
      this.currentRenderer(ctx, frame, config);
    }

    // Get raw pixel data
    const imageData = ctx.getImageData(0, 0, config.width, config.height);
    const data = imageData.data;
    const pixelCount = config.width * config.height;
    const rawBuffer = Buffer.alloc(pixelCount);

    // Convert to 1-byte per pixel (grayscale/binary)
    // We'll use the red channel as the brightness value since it's black and white
    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      // Simple brightness calculation
      const brightness = (r + g + b) / 3;
      rawBuffer[i] = brightness > 127 ? 255 : 0;
    }

    return rawBuffer;
  }

  getConfig() {
    return this.config;
  }
}

// Re-export types for convenience
export type { DisplayConfig, AnimationFrame, AnimationRenderer };
