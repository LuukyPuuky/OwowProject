import "server-only";
import { createCanvas, Canvas } from "canvas";
import type {
  DisplayConfig,
  AnimationFrame,
  AnimationRenderer,
} from "././types";

export class DisplayManager {
  private canvas: Canvas;
  private ctx: any;
  private config: DisplayConfig;
  private currentRenderer: AnimationRenderer | null = null;

  constructor(config: DisplayConfig) {
    this.config = config;

    // Use server-side canvas from 'canvas' package
    this.canvas = createCanvas(config.width, config.height);
    this.ctx = this.canvas.getContext("2d");

    // Disable anti-aliasing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = "top";
  }

  setRenderer(renderer: AnimationRenderer) {
    this.currentRenderer = renderer;
  }

  async render(frame: AnimationFrame): Promise<Buffer> {
    const { ctx, config } = this;

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

  getConfig() {
    return this.config;
  }
}

// Re-export types for convenience
export type { DisplayConfig, AnimationFrame, AnimationRenderer };
