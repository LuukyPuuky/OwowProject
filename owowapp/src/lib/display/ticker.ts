/**
 * Ticker - A requestAnimationFrame-like solution for Node.js
 * with controllable framerate
 */
export class Ticker {
  private fps: number;
  private callback:
    | ((frame: { deltaTime: number; elapsedTime: number }) => void)
    | null;
  private isRunning: boolean;
  private lastFrameTime: number;
  private frameInterval: number;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(options: { fps?: number } = {}) {
    this.fps = options.fps || 60;
    this.callback = null;
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.fps;
  }

  start(callback: (frame: { deltaTime: number; elapsedTime: number }) => void) {
    if (this.isRunning) return this;

    this.callback = callback;
    this.isRunning = true;
    this.lastFrameTime = Date.now();

    this._tick();

    return this;
  }

  stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    return this;
  }

  private _tick() {
    if (!this.isRunning) return;

    const now = Date.now();
    const timeDelta = now - this.lastFrameTime;

    if (timeDelta >= this.frameInterval) {
      // Adjust for drifting
      this.lastFrameTime = now - (timeDelta % this.frameInterval);

      // Calculate normalized delta (1.0 = exact frame rate)
      const normalizedDelta = timeDelta / this.frameInterval;

      if (this.callback) {
        this.callback({
          deltaTime: normalizedDelta,
          elapsedTime: now,
        });
      }
    }

    // Use setTimeout for Node.js compatibility
    this.timeoutId = setTimeout(() => this._tick(), 0);
  }
}
