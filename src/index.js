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
// Set a pixel-perfect monospace font
ctx.font = "18px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// 1. Define pixel-art bitmaps (1 = white dot, 0 = black)
const ICONS = {
  heart: [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  circle: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  house: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 1, 0],
  ],
};

// 2. Draw a bitmap at (x, y) with a given pixel size
function drawBitmap(ctx, bitmap, x, y, pixelSize = 6) {
  for (let row = 0; row < bitmap.length; row++) {
    for (let col = 0; col < bitmap[row].length; col++) {
      ctx.fillStyle = bitmap[row][col] ? "#fff" : "#000";
      // Draw a smaller circle for each pixel to make them less thick
      const centerX = x + col * pixelSize + pixelSize / 2;
      const centerY = y + row * pixelSize + pixelSize / 2;
      const radius = pixelSize * 0.4; // 80% of pixelSize, adjust as needed
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
  // Clear the console
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} canvas`);
  console.log("View at http://localhost:3000/view");

  ctx.clearRect(0, 0, width, height);

  // Fill the canvas with a black background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Draw centered pixel-art emoji (cycles every 2 seconds)
  {
    const iconNames = Object.keys(ICONS);
    const iconIndex = Math.floor((elapsedTime / 2000) % iconNames.length);
    const icon = ICONS[iconNames[iconIndex]];
    const pixelSize = 4;
    const iconWidth = icon[0].length * pixelSize;
    const iconHeight = icon.length * pixelSize;
    const iconX = Math.floor((width - iconWidth) / 2);
    const iconY = Math.floor((height - iconHeight) / 2);
    drawBitmap(ctx, icon, iconX, iconY, pixelSize);
  }

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
      data[i + 3] = 255; // The board is not transparent :-)
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

  console.log(`Eslapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
  console.timeEnd("Write frame");
});
