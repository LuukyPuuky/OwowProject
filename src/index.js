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
let slowFrame = 0;  // For slower movement

// Helper to get the border index for a cell, or -1 if not on border
function getBorderIndex(x, y, cols, rows) {
  if (y === 0) return x; // Top row, left to right
  if (x === cols - 1) return cols - 1 + y; // Right column, top to bottom
  if (y === rows - 1) return cols - 1 + rows - 1 + (cols - 1 - x); // Bottom row, right to left
  if (x === 0) return cols - 1 + rows - 1 + cols - 1 + (rows - 1 - y); // Left column, bottom to top
  return -1; // Not a border cell
}

// Define pixel-art bitmaps for "SALE" (5x7 font)
const SALE_BITMAPS = [
  // S
  [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
  ],
  // A
  [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  // L
  [
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  // E
  [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
];

// Helper to draw a bitmap at (x, y) with a given pixel size
function drawBitmap(ctx, bitmap, x, y, pixelSize = 6) {
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      ctx.fillStyle = bitmap[row][col] ? "#fff" : "#000";
      // Draw a small circle for each pixel
      const centerX = x + col * pixelSize + pixelSize / 2;
      const centerY = y + row * pixelSize + pixelSize / 2;
      const radius = pixelSize * 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

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

  // Draw the LAYOUT as a grid of numbers with moving border lights
  const rows = LAYOUT.length;
  const cols = LAYOUT[0].length;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  ctx.font = `${Math.floor(cellHeight * 0.5)}px monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  // Calculate which border cell should be "lit"
  const borderLength = 2 * (rows + cols) - 4;
  const litIndex = Math.floor(slowFrame / 4) % borderLength; // Move 4x slower

for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const borderIdx = getBorderIndex(x, y, cols, rows);
      // Draw cell background
      if (borderIdx !== -1) {
        ctx.fillStyle = "#444"; // Dim border
      } else {
        ctx.fillStyle = "#222"; // Normal cell background
      }
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

   // Draw multiple moving lights
const numDots = 9;
for (let d = 0; d < numDots; d++) {
  if (borderIdx === (litIndex + d) % borderLength) {
    ctx.save();
    ctx.fillStyle = "#ff0";
    ctx.beginPath();
    ctx.arc(
      x * cellWidth + cellWidth / 2,
      y * cellHeight + cellHeight / 2,
      Math.min(cellWidth, cellHeight) * 0.2,
      0,
      2 * Math.PI
    );
    ctx.fill();
    ctx.restore();
  }
}

      // Draw cell border
      ctx.strokeStyle = "#888";
      ctx.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);


  // Draw "SALE" pixel-art centered on the grid
  {
    const pixelSize = Math.floor(Math.min(cellWidth, cellHeight) / 2.7);
    const letterSpacing = 1;
    const letterWidth = SALE_BITMAPS[0][0].length * pixelSize;
    const letterHeight = SALE_BITMAPS[0].length * pixelSize;
    const totalWidth = SALE_BITMAPS.length * letterWidth + (SALE_BITMAPS.length - 1) * letterSpacing * pixelSize;
    const startX = Math.floor((width - totalWidth) / 2);
    const startY = Math.floor((height - letterHeight) / 2);

    for (let i = 0; i < SALE_BITMAPS.length; i++) {
      drawBitmap(
        ctx,
        SALE_BITMAPS[i],
        startX + i * (letterWidth + letterSpacing * pixelSize),
        startY,
        pixelSize
      );
    }
  }
}}

   
 

  // Convert image to binary (purely black and white) for flipdot display
  {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Apply thresholding - any pixel above 127 brightness becomes white (255), otherwise black (0)
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binary = brightness > 127 ? 255 : 0;
      data[i] = binary; // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
      data[i + 3] = 255; // The board is not transparent 
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (IS_DEV) {
    // Save the canvas as a PNG file
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

  frameCount++; // Increment frame for animation
slowFrame++; // Increment for slower movement

console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
  console.timeEnd("Write frame");
});