import { AnimationRenderer } from "../display/display-manager";

export const pongMetadata = {
  id: "pong",
  name: "Pong",
  description: "A classic Pong game animation",
  thumbnail: "/api/thumbnail/pong",
  status: "Available" as const,
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

const pongState: PongState = {
  ball: { x: 0.5, y: 0.5, vx: 0.012, vy: 0.015 },
  paddleLeft: 0.4,
  paddleRight: 0.4,
  paddleHeight: 0.2,
  scoreLeft: 0,
  scoreRight: 0,
  lastElapsedTime: 0,
  initialized: false,
};

export const pongAnimation: AnimationRenderer = (ctx, frame, config) => {
  if (!ctx) return;
  const { width, height } = config;
  const { elapsedTime } = frame;

  // Initialize on first frame
  if (!pongState.initialized) {
    pongState.lastElapsedTime = elapsedTime;
    pongState.initialized = true;
  }

  // Calculate delta time in seconds
  const deltaTime = (elapsedTime - pongState.lastElapsedTime) / 1000;
  pongState.lastElapsedTime = elapsedTime;

  // Clear background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Calculate pixel positions
  const ballX = Math.floor(pongState.ball.x * width);
  const ballY = Math.floor(pongState.ball.y * height);
  const paddleW = Math.floor(width * 0.02);
  const paddleH = Math.floor(height * pongState.paddleHeight);

  // Move ball (frame-rate independent)
  pongState.ball.x += pongState.ball.vx * deltaTime;
  pongState.ball.y += pongState.ball.vy * deltaTime;

  // Bounce off top/bottom
  if (pongState.ball.y < 0) {
    pongState.ball.y = 0;
    pongState.ball.vy *= -1;
  }
  if (pongState.ball.y > 1) {
    pongState.ball.y = 1;
    pongState.ball.vy *= -1;
  }

  // Bounce off paddles - Left paddle
  if (
    pongState.ball.x < 0.05 &&
    pongState.ball.y > pongState.paddleLeft &&
    pongState.ball.y < pongState.paddleLeft + pongState.paddleHeight
  ) {
    pongState.ball.x = 0.05;
    pongState.ball.vx *= -1;
  }

  // Right paddle
  if (
    pongState.ball.x > 0.95 &&
    pongState.ball.y > pongState.paddleRight &&
    pongState.ball.y < pongState.paddleRight + pongState.paddleHeight
  ) {
    pongState.ball.x = 0.95;
    pongState.ball.vx *= -1;
  }

  // Left player missed
  if (pongState.ball.x < 0) {
    pongState.scoreRight++;
    pongState.ball.x = 0.5;
    pongState.ball.y = 0.5;
    pongState.ball.vx = 0.012;
    pongState.ball.vy = 0.015;
  }

  // Right player missed
  if (pongState.ball.x > 1) {
    pongState.scoreLeft++;
    pongState.ball.x = 0.5;
    pongState.ball.y = 0.5;
    pongState.ball.vx = -0.012;
    pongState.ball.vy = 0.015;
  }

  // Simple AI for paddles (frame-rate independent)
  pongState.paddleLeft +=
    (pongState.ball.y - pongState.paddleLeft - pongState.paddleHeight / 2) *
    0.05 *
    deltaTime;
  pongState.paddleRight +=
    (pongState.ball.y - pongState.paddleRight - pongState.paddleHeight / 2) *
    0.05 *
    deltaTime;

  // Clamp paddles
  pongState.paddleLeft = Math.max(
    0,
    Math.min(1 - pongState.paddleHeight, pongState.paddleLeft)
  );
  pongState.paddleRight = Math.max(
    0,
    Math.min(1 - pongState.paddleHeight, pongState.paddleRight)
  );

  // Draw paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(2, Math.floor(pongState.paddleLeft * height), paddleW, paddleH);
  ctx.fillRect(
    width - paddleW - 2,
    Math.floor(pongState.paddleRight * height),
    paddleW,
    paddleH
  );

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, Math.floor(width * 0.02), 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Draw scoreboard
  ctx.font = "16px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const scoreY = 8;
  ctx.fillText(
    `${pongState.scoreLeft}   ${pongState.scoreRight}`,
    width / 2,
    scoreY
  );

  // Center line for classic Pong look
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 30);
  ctx.lineTo(width / 2, height - 10);
  ctx.stroke();
  ctx.setLineDash([]);
};
