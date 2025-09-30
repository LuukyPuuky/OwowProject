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

let frameCount = 0; 
// --- DVD Bouncing Text State ---
let dvd = {
  x: width / 2,
  y: height / 2,
  vx: 0.7,   
  vy: 0.7,
  size: 0.2, 
  text: "DVD"
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

  // --- DVD Text Animation ---
  ctx.font = "15px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(dvd.text);
  const textW = metrics.width;
  const textH = 20;

  // Move text
  dvd.x += dvd.vx;
  dvd.y += dvd.vy;

  // Bounce horizontally
  if (dvd.x <= 0) {
    dvd.x = 0;
    dvd.vx = Math.abs(dvd.vx);
  }
  if (dvd.x + textW >= width) {
    dvd.x = width - textW;
    dvd.vx = -Math.abs(dvd.vx);
  }

  // Bounce vertically
  if (dvd.y <= 0) {
    dvd.y = 0;
    dvd.vy = Math.abs(dvd.vy);
  }
  if (dvd.y + textH >= height) {
    dvd.y = height - textH;
    dvd.vy = -Math.abs(dvd.vy);
  }

  // Draw only the text
  ctx.fillStyle = "#fff";
  ctx.fillText(dvd.text, dvd.x, dvd.y);

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
