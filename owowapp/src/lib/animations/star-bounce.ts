import type { AnimationRenderer } from ".././display/types";

export const starBounceMetadata = {
  id: "1",
  name: "Star",
  description: "Displays a star that moves in different directions",
  status: "Available" as const,
};

interface StarState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lastElapsedTime: number;
  initialized: boolean;
}

const stateMap = new WeakMap<object, StarState>();

const getInitialState = (): StarState => ({
  x: 0.5,
  y: 0.5,
  vx: 0.4,
  vy: 0.3,
  lastElapsedTime: 0,
  initialized: false,
});

export const starBounceAnimation: AnimationRenderer = (ctx, frame, config) => {
  if (!ctx) return;

  let state = stateMap.get(ctx as object);
  if (!state) {
    state = getInitialState();
    stateMap.set(ctx as object, state);
  }

  const { width, height } = config;
  const { elapsedTime } = frame;

  if (!state.initialized) {
    state.lastElapsedTime = elapsedTime;
    state.initialized = true;
  }

  let deltaTime = (elapsedTime - state.lastElapsedTime) / 1000;
  if (deltaTime > 0.1) deltaTime = 0.016;
  if (deltaTime < 0) deltaTime = 0;
  state.lastElapsedTime = elapsedTime;

  // Move
  state.x += state.vx * deltaTime;
  state.y += state.vy * deltaTime;

  // Bounce
  if (state.x < 0 || state.x > 1) {
    state.vx *= -1;
    state.x = Math.max(0, Math.min(1, state.x));
  }
  if (state.y < 0 || state.y > 1) {
    state.vy *= -1;
    state.y = Math.max(0, Math.min(1, state.y));
  }

  // Draw
  const size = 8;
  // Map normalized coordinates to canvas, keeping star fully inside
  const x = Math.floor(state.x * (width - size));
  const y = Math.floor(state.y * (height - size));

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
};
