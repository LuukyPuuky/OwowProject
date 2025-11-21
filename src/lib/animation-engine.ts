import "server-only";
import { Ticker } from "./display/ticker";
import { DisplayManager } from "./display/display-manager";
import { FPS } from "./display/settings";
import { getAnimation, type AnimationId } from "./animations";

class AnimationEngine {
  private displayManager: DisplayManager;
  private ticker: Ticker;
  private currentAnimationId: AnimationId | null = null;
  private latestFrame: Buffer | null = null;
  private isRunning = false;

  constructor() {
    // 80x20 pixel display
    this.displayManager = new DisplayManager({
      width: 80,
      height: 20,
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
