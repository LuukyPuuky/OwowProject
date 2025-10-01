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

// Create canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// Initialize ticker
const ticker = new Ticker({ fps: FPS });

// Announcement Board State
const announcements = [
  "Welcome to the Office!",
  "Meeting at 3 PM in Conference Room A",
  "Lunch Special: Pizza Today",

];

let currentIndex = 0;
let xPos = width;

// Scrolling speed in pixels per frame
const SCROLL_SPEED = 1;

ticker.start(({ deltaTime, elapsedTime }) => {
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} flipdot announcement board`);
  console.log("View at http://localhost:3000/view");

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Draw Current Announcement 
  const text = announcements[currentIndex];
  ctx.font = "20px monospace";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(text);
  const textW = metrics.width;
  const textH = 24;

  const y = height / 2;

  ctx.fillText(text, xPos, height / 2 - 10);

  // Scroll left
  xPos -= SCROLL_SPEED;

  // Move to next announcement when current one scrolls off screen
  if (xPos + textW < 0) {
    currentIndex = (currentIndex + 1) % announcements.length;
    xPos = width; 
  }

  // Convert image to binary for flipdot
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

  console.timeEnd("Write frame");
})