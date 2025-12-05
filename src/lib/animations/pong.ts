import { AnimationRenderer } from "../display/types";

// Generate a thumbnail showing pong setup
const generatePongThumbnail = (): boolean[] => {
  const width = 80;
  const height = 20;
  const pixels = new Array(width * height).fill(false);
  
  // Draw left paddle (x=3-4, y=7-13)
  for (let y = 7; y <= 13; y++) {
    pixels[y * width + 3] = true;
    pixels[y * width + 4] = true;
  }
  
  // Draw right paddle (x=75-76, y=7-13)
  for (let y = 7; y <= 13; y++) {
    pixels[y * width + 75] = true;
    pixels[y * width + 76] = true;
  }
  
  // Draw ball in center (3x3)
  const ballX = 39;
  const ballY = 9;
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      pixels[(ballY + dy) * width + (ballX + dx)] = true;
    }
  }
  
  // Draw center line (dashed)
  for (let y = 0; y < height; y += 3) {
    pixels[y * width + 40] = true;
    if (y + 1 < height) pixels[(y + 1) * width + 40] = true;
  }
  
  return pixels;
};

export const pongMetadata = {
  id: "pong",
  name: "Pong",
  description: "A classic Pong game animation",
  status: "Available" as const,
  thumbnail: generatePongThumbnail(),
};

interface PongState {
  ball: { x: number; y: number; vx: number; vy: number };
  paddleLeft: number;
  paddleRight: number;
  paddleHeight: number;
  scoreLeft: number;
  scoreRight: number;
  lastElapsedTime: number;
  initialized: boolean;
}

// Use WeakMap to store state per canvas context (effectively per stream/user)
const stateMap = new WeakMap<object, PongState>();

const getInitialState = (): PongState => ({
  // Increased velocity: 0.012 * 60 = 0.72 units/sec approx
  ball: { x: 0.5, y: 0.5, vx: 0.8, vy: 0.6 },
  paddleLeft: 0.4,
  paddleRight: 0.4,
  paddleHeight: 0.25,
  scoreLeft: 0,
  scoreRight: 0,
  lastElapsedTime: 0,
  initialized: false,
});

export const pongAnimation: AnimationRenderer = (ctx, frame, config) => {
  if (!ctx) return;

  // Retrieve or initialize state for this context
  // We cast ctx to object because WeakMap keys must be objects
  // CanvasContext can be null, but we checked above
  let state = stateMap.get(ctx as object);
  if (!state) {
    state = getInitialState();
    stateMap.set(ctx as object, state);
  }

  const { width, height } = config;
  const { elapsedTime } = frame;

  // Initialize on first frame
  if (!state.initialized) {
    state.lastElapsedTime = elapsedTime;
    state.initialized = true;
  }

  // Calculate delta time in seconds
  // Prevent huge jumps if there's a hiccup or on first frame
  let deltaTime = (elapsedTime - state.lastElapsedTime) / 1000;
  if (deltaTime > 0.1) deltaTime = 0.016; // Cap at ~60fps equivalent if lag spike
  if (deltaTime < 0) deltaTime = 0;

  state.lastElapsedTime = elapsedTime;

  // Clear background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Calculate pixel positions
  const ballX = Math.floor(state.ball.x * width);
  const ballY = Math.floor(state.ball.y * height);
  const paddleW = Math.max(2, Math.floor(width * 0.02));
  const paddleH = Math.floor(height * state.paddleHeight);

  // Move ball
  state.ball.x += state.ball.vx * deltaTime;
  state.ball.y += state.ball.vy * deltaTime;

  // Bounce off top/bottom
  if (state.ball.y < 0) {
    state.ball.y = 0;
    state.ball.vy *= -1;
  }
  if (state.ball.y > 1) {
    state.ball.y = 1;
    state.ball.vy *= -1;
  }

  // Bounce off paddles - Left paddle
  // Hitbox check
  const paddleLeftY = state.paddleLeft;
  if (
    state.ball.x < 0.05 &&
    state.ball.y >= paddleLeftY &&
    state.ball.y <= paddleLeftY + state.paddleHeight
  ) {
    state.ball.x = 0.05;
    state.ball.vx *= -1;
    // Add some english based on where it hit
    state.ball.vy += (Math.random() - 0.5) * 0.2;
  }

  // Right paddle
  const paddleRightY = state.paddleRight;
  if (
    state.ball.x > 0.95 &&
    state.ball.y >= paddleRightY &&
    state.ball.y <= paddleRightY + state.paddleHeight
  ) {
    state.ball.x = 0.95;
    state.ball.vx *= -1;
    state.ball.vy += (Math.random() - 0.5) * 0.2;
  }

  // Left player missed
  if (state.ball.x < -0.1) {
    state.scoreRight++;
    resetBall(state, 1);
  }

  // Right player missed
  if (state.ball.x > 1.1) {
    state.scoreLeft++;
    resetBall(state, -1);
  }

  // Simple AI for paddles
  // Move towards ball Y
  const moveSpeed = 0.6; // Speed of AI

  // Left paddle AI
  if (state.ball.vx < 0) {
    // Only move if ball is coming
    const targetY = state.ball.y - state.paddleHeight / 2;
    if (state.paddleLeft < targetY) state.paddleLeft += moveSpeed * deltaTime;
    if (state.paddleLeft > targetY) state.paddleLeft -= moveSpeed * deltaTime;
  }

  // Right paddle AI
  if (state.ball.vx > 0) {
    const targetY = state.ball.y - state.paddleHeight / 2;
    if (state.paddleRight < targetY) state.paddleRight += moveSpeed * deltaTime;
    if (state.paddleRight > targetY) state.paddleRight -= moveSpeed * deltaTime;
  }

  // Clamp paddles
  state.paddleLeft = Math.max(
    0,
    Math.min(1 - state.paddleHeight, state.paddleLeft)
  );
  state.paddleRight = Math.max(
    0,
    Math.min(1 - state.paddleHeight, state.paddleRight)
  );

  // Draw paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(2, Math.floor(state.paddleLeft * height), paddleW, paddleH);
  ctx.fillRect(
    width - paddleW - 2,
    Math.floor(state.paddleRight * height),
    paddleW,
    paddleH
  );

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, Math.max(2, Math.floor(width * 0.02)), 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Draw scoreboard
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Only draw score if we have room (height > 20) or very small
  if (height >= 20) {
    ctx.fillText(`${state.scoreLeft}   ${state.scoreRight}`, width / 2, 2);
  }

  // Center line
  ctx.setLineDash([2, 2]);
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);
};

function resetBall(state: PongState, direction: number) {
  state.ball.x = 0.5;
  state.ball.y = 0.5;
  state.ball.vx = 0.8 * direction;
  state.ball.vy = (Math.random() - 0.5) * 0.8;
}
