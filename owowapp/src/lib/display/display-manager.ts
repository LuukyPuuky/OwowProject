import "server-only";
import type {
  DisplayConfig,
  AnimationFrame,
  AnimationRenderer,
} from "././types";

export class DisplayManager {
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private config: DisplayConfig;
  private currentRenderer: AnimationRenderer | null = null;

  constructor(config: DisplayConfig) {
    this.config = config;

    // Use OffscreenCanvas if available (better for server-side rendering in modern environments)
    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(config.width, config.height);
      this.ctx = this.canvas.getContext("2d")!;
    } else if (typeof document !== "undefined") {
      // Fallback to regular canvas in browser environment
      this.canvas = document.createElement("canvas");
      this.canvas.width = config.width;
      this.canvas.height = config.height;
      this.ctx = this.canvas.getContext("2d")!;
    } else {
      throw new Error("Canvas not available in this environment");
    }

    // Disable anti-aliasing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    if ("textBaseline" in this.ctx) {
      this.ctx.textBaseline = "top";
    }
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

    // Convert canvas to buffer
    if (this.canvas instanceof OffscreenCanvas) {
      const blob = await this.canvas.convertToBlob({ type: "image/png" });
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      // For regular canvas, use toDataURL and convert to buffer
      const dataUrl = (this.canvas as HTMLCanvasElement).toDataURL("image/png");
      const base64 = dataUrl.split(",")[1];
      return Buffer.from(base64, "base64");
    }
  }

  getConfig() {
    return this.config;
  }
}

// Re-export types for convenience
export type { DisplayConfig, AnimationFrame, AnimationRenderer };
