import "server-only";
import { Ticker } from "../display/ticker";
import { DisplayManager } from "../display/display-manager";
import { FPS, HARDWARE_WIDTH, HARDWARE_HEIGHT } from "../display/settings";
import { getAnimation, type AnimationId } from "../animations";

class AnimationEngine {
  private displayManager: DisplayManager;
  private ticker: Ticker;
  private currentAnimationId: AnimationId | null = null;
  private latestFrame: Buffer | null = null;
  private isRunning = false;

  constructor() {
    // Hardware display dimensions for actual flipdot board
    this.displayManager = new DisplayManager({
      width: HARDWARE_WIDTH,
      height: HARDWARE_HEIGHT,
      fps: FPS,
    });

    this.ticker = new Ticker({ fps: FPS });
  }

  start(animationId: AnimationId) {
    const animation = getAnimation(animationId);
    if (!animation) {
      throw new Error(`Animation ${animationId} not found`);
    }

    this.currentAnimationId = animationId;
    this.displayManager.setRenderer(animation.renderer);

    if (!this.isRunning) {
      this.isRunning = true;
      this.ticker.start(async (frame) => {
        this.latestFrame = await this.displayManager.render(frame);
      });
    }
  }

  startCustom(frames: Array<{ dur: number; arr: boolean[] }>) {
    this.currentAnimationId = null; // Custom animations don't have an ID in the registry
    
    let currentFrameIndex = 0;
    let lastFrameTime = Date.now();

    // Create a custom renderer for the frames
    const customRenderer = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null) => {
      if (!ctx) return;
      
      const now = Date.now();
      const currentFrame = frames[currentFrameIndex];
      
      // Check if it's time to advance to next frame
      if (now - lastFrameTime >= currentFrame.dur) {
        currentFrameIndex = (currentFrameIndex + 1) % frames.length;
        lastFrameTime = now;
      }

      // Render the current frame
      const imageData = ctx.createImageData(HARDWARE_WIDTH, HARDWARE_HEIGHT);
      const data = imageData.data;
      
      for (let i = 0; i < currentFrame.arr.length && i < HARDWARE_WIDTH * HARDWARE_HEIGHT; i++) {
        const pixelValue = currentFrame.arr[i] ? 255 : 0;
        const index = i * 4;
        data[index] = pixelValue;     // R
        data[index + 1] = pixelValue; // G
        data[index + 2] = pixelValue; // B
        data[index + 3] = 255;        // A
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    this.displayManager.setRenderer(customRenderer);

    if (!this.isRunning) {
      this.isRunning = true;
      this.ticker.start(async (frame) => {
        this.latestFrame = await this.displayManager.render(frame);
      });
    }
  }

  stop() {
    this.ticker.stop();
    this.isRunning = false;
    this.latestFrame = null;
  }

  getLatestFrame(): Buffer | null {
    return this.latestFrame;
  }

  getCurrentAnimationId(): AnimationId | null {
    return this.currentAnimationId;
  }
}

// Singleton instance
export const animationEngine = new AnimationEngine();
