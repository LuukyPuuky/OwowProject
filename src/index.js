import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
  layout: LAYOUT,
  panelWidth: 28,
  isMirrored: true,
  transport: !IS_DEV
    ? {
        type: "serial",
        path: "/dev/ttyACM0",
        baudRate: 57600,
      }
    : {
        type: "ip",
        host: "127.0.0.1",
        port: 3000,
      },
});

const { width, height } = display;

// Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Register fonts
registerFont(
  path.resolve(import.meta.dirname, "../fonts/OpenSans-Variable.ttf"),
  { family: "OpenSans" }
);
registerFont(
  path.resolve(import.meta.dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
  { family: "PPNeueMontreal" }
);
registerFont(path.resolve(import.meta.dirname, "../fonts/Px437_ACM_VGA.ttf"), {
  family: "Px437_ACM_VGA",
});

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

let frameCount = 0; // For animation

// Helper to get the border index for a cell, or -1 if not on border
function getBorderIndex(x, y, cols, rows) {
  if (y === 0) return x; // Top row, left to right
  if (x === cols - 1) return cols - 1 + y; // Right column, top to bottom
  if (y === rows - 1) return cols - 1 + rows - 1 + (cols - 1 - x); // Bottom row, right to left
  if (x === 0) return cols - 1 + rows - 1 + cols - 1 + (rows - 1 - y); // Left column, bottom to top
  return -1; // Not a border cell
}

// Pong game state
let pong = {
  ball: { x: 0.5, y: 0.5, vx: 0.012, vy: 0.015 },
  paddleLeft: 0.4,
  paddleRight: 0.4,
  paddleHeight: 0.2,
};

ticker.start(({ deltaTime, elapsedTime }) => {
  // Clear the console
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} flipdot billboard`);
  console.log("View at http://localhost:3000/view");

  ctx.clearRect(0, 0, width, height);

  // Fill the canvas with a black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Grid setup
  const rows = LAYOUT.length;
  const cols = LAYOUT[0].length;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  ctx.font = `${Math.floor(cellHeight * 0.5)}px monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";



 

  // --- Pong Animation ---
  // Calculate pixel positions
  const ballX = Math.floor(pong.ball.x * width);
  const ballY = Math.floor(pong.ball.y * height);
  const paddleW = Math.floor(width * 0.02);
  const paddleH = Math.floor(height * pong.paddleHeight);

  // Move ball
  pong.ball.x += pong.ball.vx;
  pong.ball.y += pong.ball.vy;

  // Bounce off top/bottom
  if (pong.ball.y < 0) {
    pong.ball.y = 0;
    pong.ball.vy *= -1;
  }
  if (pong.ball.y > 1) {
    pong.ball.y = 1;
    pong.ball.vy *= -1;
  }

  // Bounce off paddles
  // Left paddle
  if (
    pong.ball.x < 0.05 &&
    pong.ball.y > pong.paddleLeft &&
    pong.ball.y < pong.paddleLeft + pong.paddleHeight
  ) {
    pong.ball.x = 0.05;
    pong.ball.vx *= -1;
  }
  // Right paddle
  if (
    pong.ball.x > 0.95 &&
    pong.ball.y > pong.paddleRight &&
    pong.ball.y < pong.paddleRight + pong.paddleHeight
  ) {
    pong.ball.x = 0.95;
    pong.ball.vx *= -1;
  }

  // Simple AI for paddles
  pong.paddleLeft += (pong.ball.y - pong.paddleLeft - pong.paddleHeight / 2) * 0.05;
  pong.paddleRight += (pong.ball.y - pong.paddleRight - pong.paddleHeight / 2) * 0.05;

  // Clamp paddles
  pong.paddleLeft = Math.max(0, Math.min(1 - pong.paddleHeight, pong.paddleLeft));
  pong.paddleRight = Math.max(0, Math.min(1 - pong.paddleHeight, pong.paddleRight));

  // Draw paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    2,
    Math.floor(pong.paddleLeft * height),
    paddleW,
    paddleH
  );
  ctx.fillRect(
    width - paddleW - 2,
    Math.floor(pong.paddleRight * height),
    paddleW,
    paddleH
  );

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX, ballY, Math.floor(width * 0.02), 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();

  let pong = {
  ball: { x: 0.5, y: 0.5, vx: 0.012, vy: 0.015 },
  paddleLeft: 0.4,
  paddleRight: 0.4,
  paddleHeight: 0.2,
  scoreLeft: 0,
  scoreRight: 0,
};
// Left player missed
if (pong.ball.x < 0) {
  pong.scoreRight++;
  pong.ball.x = 0.5;
  pong.ball.y = 0.5;
  pong.ball.vx = 0.012;
  pong.ball.vy = 0.015;
}

// Right player missed
if (pong.ball.x > 1) {
  pong.scoreLeft++;
  pong.ball.x = 0.5;
  pong.ball.y = 0.5;
  pong.ball.vx = -0.012;
  pong.ball.vy = 0.015;
}

ctx.font = `${Math.floor(height * 0.1)}px monospace`;
ctx.fillStyle = "#fff";
ctx.textAlign = "center";
ctx.fillText(
  `${pong.scoreLeft}   ${pong.scoreRight}`,
  width / 2,
  Math.floor(height * 0.1)
);

  // --- End Pong Animation ---

  // Convert image to binary (purely black and white) for flipdot display
  {
    const imageData = ctx.getImageData(0, 0, width, height);
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
  }

  if (IS_DEV) {
    const filename = path.join(outputDir, "frame.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
  } else {
    const imageData = ctx.getImageData(0, 0, display.width, display.height);
    display.setImageData(imageData);
    if (display.isDirty()) {
      display.flush();
    }
  }

  frameCount++;

  console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
  console.timeEnd("Write frame");
});