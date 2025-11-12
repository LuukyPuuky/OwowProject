import express from "express";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGIF, decompressFrames } from "gifuct-js";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { Ticker } from "./ticker.js";

const IS_DEV = process.argv.includes("--dev");
const app = express();


// Setup static files and JSON parsing
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));


// Setup multer for file uploads
const upload = multer({ dest: "./uploads/" });

// Store uploaded GIFs in memory
const uploadedGIFs = new Map(); // { fileName: { frames, width, height, delays } }
let currentGIF = null; // Currently playing GIF
let currentFrameIndex = 0;

// Create display (your existing code)
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

// **Upload multiple GIFs**
app.post("/upload", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
    // gifuct-js expects an ArrayBuffer
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const gif = parseGIF(arrayBuffer);
    const frames = decompressFrames(gif, true);
        
   const fileName = file.originalname || `gif_${Date.now()}.gif`;

    uploadedGIFs.set(fileName, {
      frames,
      width: gif.lsd.width,
      height: gif.lsd.height,
      delays: frames.map((f) => (f.delay || 10) * 10), // Convert to ms
    });

        uploadedFiles.push({
          name: fileName,
          frameCount: frames.length,
        });

        // Set as current if it's the first upload
        if (!currentGIF) {
          currentGIF = fileName;
          currentFrameIndex = 0;
        }

        // Clean up temp file
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error(`Error processing ${file.originalname}:`, err.message);
  }
}
    res.json({
      success: true,
      uploaded: uploadedFiles,
      currentGIF,
      allGIFs: Array.from(uploadedGIFs.keys()),
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// **List all uploaded GIFs**
app.get("/gifs", (req, res) => {
  res.json({
    gifs: Array.from(uploadedGIFs.keys()),
    current: currentGIF,
  });
});

// **Select a GIF to play**
app.post("/select-gif", express.json(), (req, res) => {
  const { name } = req.body;

  if (!uploadedGIFs.has(name)) {
    return res.status(404).json({ error: "GIF not found" });
  }

  currentGIF = name;
  currentFrameIndex = 0;

  res.json({
    success: true,
    currentGIF,
  });
});

// **Delete a GIF**
app.post("/delete-gif", express.json(), (req, res) => {
  const { name } = req.body;

  if (!uploadedGIFs.has(name)) {
    return res.status(404).json({ error: "GIF not found" });
  }

  uploadedGIFs.delete(name);

  // If deleted GIF was playing, switch to first available
  if (currentGIF === name) {
    currentGIF = uploadedGIFs.size > 0 ? Array.from(uploadedGIFs.keys())[0] : null;
    currentFrameIndex = 0;
  }

  res.json({
    success: true,
    allGIFs: Array.from(uploadedGIFs.keys()),
    currentGIF,
  });
});

// **Main loop - play current GIF frame**
const ticker = new Ticker({ fps: 30 });

ticker.start(({ deltaTime, elapsedTime }) => {
  if (!currentGIF || !uploadedGIFs.has(currentGIF)) {
    return; // No GIF selected
  }

  const gifData = uploadedGIFs.get(currentGIF);
  const frame = gifData.frames[currentFrameIndex];

  // Draw frame to canvas
  const frameCanvas = createCanvas(gifData.width, gifData.height);
  const frameCtx = frameCanvas.getContext("2d");
  const frameImageData = frameCtx.createImageData(gifData.width, gifData.height);
  frameImageData.data.set(frame.patch);
  frameCtx.putImageData(frameImageData, 0, 0);

  // Scale/process to display size
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(frameCanvas, 0, 0, width, height);

  // Apply thresholding
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = brightness > 127 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  // Send to display
  if (!IS_DEV) {
    display.setImageData(imageData);
    if (display.isDirty()) display.flush();
  } else {
    const filename = path.join("./output", "frame.png");
    fs.writeFileSync(filename, canvas.toBuffer("image/png"));
  }

  // Advance frame
  currentFrameIndex = (currentFrameIndex + 1) % gifData.frames.length;
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});