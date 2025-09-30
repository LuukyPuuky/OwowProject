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

// --- DVD Bouncing Logo State ---
let dvd = {
  x: width / 2,
  y: height / 2,
  vx: 2,
  vy: 2,
  size: 0.15, // relative size of logo
  color: "#fff",
  colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
};

ticker.start(({ deltaTime, elapsedTime }) => {
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} flipdot billboard`);
  console.log("View at http://localhost:3000/view");

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // --- DVD Animation ---
  const logoW = Math.floor(width * dvd.size);
  const logoH = Math.floor(height * dvd.size * 0.5);

  // Move logo
  dvd.x += dvd.vx;
  dvd.y += dvd.vy;

  // Bounce horizontally
  if (dvd.x < 0) {
    dvd.x = 0;
    dvd.vx *= -1;
    dvd.color = dvd.colors[Math.floor(Math.random() * dvd.colors.length)];
  }
  if (dvd.x + logoW > width) {
    dvd.x = width - logoW;
    dvd.vx *= -1;
    dvd.color = dvd.colors[Math.floor(Math.random() * dvd.colors.length)];
  }

  // Bounce vertically
  if (dvd.y < 0) {
    dvd.y = 0;
    dvd.vy *= -1;
    dvd.color = dvd.colors[Math.floor(Math.random() * dvd.colors.length)];
  }
  if (dvd.y + logoH > height) {
    dvd.y = height - logoH;
    dvd.vy *= -1;
    dvd.color = dvd.colors[Math.floor(Math.random() * dvd.colors.length)];
  }

  // Draw logo (rectangle with "DVD" text)
  ctx.fillStyle = dvd.color;
  ctx.fillRect(dvd.x, dvd.y, logoW, logoH);

  ctx.fillStyle = "#000";
  ctx.font = `${Math.floor(logoH * 0.6)}px "PPNeueMontreal", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DVD", dvd.x + logoW / 2, dvd.y + logoH / 2);

  // --- End DVD Animation ---

  // Convert image to binary for flipdot
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
