import express from "express";
import cors from "cors";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGIF, decompressFrames } from "gifuct-js";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import { Ticker } from "./ticker.js";
import { WebSocketServer } from "ws";
import http from "http";

const IS_DEV = process.argv.includes("--dev");
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add CORS middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const upload = multer({ dest: "./uploads/" });

// Store uploaded GIFs/images in memory
const uploadedGIFs = new Map();
let currentGIF = null;
let currentFrameIndex = 0;
let wsClients = [];

function broadcastList() {
  const payload = JSON.stringify({
    type: "list",
    gifs: Array.from(uploadedGIFs.keys()),
    current: currentGIF,
  });
  wsClients.forEach((client) => {
    if (client && client.readyState === 1) client.send(payload);
  });
}

function broadcastFrame(imageData) {
  const data = imageData.data;
  const buffer = Buffer.from(data);
  wsClients.forEach((client) => {
    if (client && client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "frame",
          data: buffer.toString("base64"),
          width: imageData.width,
          height: imageData.height,
        })
      );
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");
  wsClients.push(ws);

  ws.send(
    JSON.stringify({
      type: "list",
      gifs: Array.from(uploadedGIFs.keys()),
      current: currentGIF,
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected");
    wsClients = wsClients.filter((c) => c !== ws);
  });
});

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
        port: 4000,
      },
    
});

const { width, height } = display;



// Upload handler
app.post("/upload", upload.array("images", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        const buffer = fs.readFileSync(file.path);
        const ext = path.extname(file.originalname || "").toLowerCase();
        const isGif = file.mimetype === "image/gif" || ext === ".gif";
        const fileName = file.originalname || `img_${Date.now()}${ext || ".png"}`;

        if (isGif) {
          const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          const gif = parseGIF(arrayBuffer);
          const frames = decompressFrames(gif, true);

          uploadedGIFs.set(fileName, {
            type: "gif",
            frames,
            width: gif.lsd.width,
            height: gif.lsd.height,
            delays: frames.map((f) => (f.delay || 10) * 10),
          });

          uploadedFiles.push({ name: fileName, frameCount: frames.length });
        } else {
          const img = await loadImage(buffer);
          const imgW = img.width;
          const imgH = img.height;
          const imgCanvas = createCanvas(imgW, imgH);
          const imgCtx = imgCanvas.getContext("2d");
          imgCtx.drawImage(img, 0, 0, imgW, imgH);
          const imgData = imgCtx.getImageData(0, 0, imgW, imgH);

          const singleFrame = {
            patch: new Uint8ClampedArray(imgData.data),
            dims: { width: imgW, height: imgH, left: 0, top: 0 },
          };

          uploadedGIFs.set(fileName, {
            type: "image",
            frames: [singleFrame],
            width: imgW,
            height: imgH,
            delays: [100],
          });

          uploadedFiles.push({ name: fileName, frameCount: 1 });
        }

        if (!currentGIF) {
          currentGIF = fileName;
          currentFrameIndex = 0;
        }

        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err.message);
      }
    }

    broadcastList();

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

app.get("/gifs", (req, res) => {
  res.json({
    gifs: Array.from(uploadedGIFs.keys()),
    current: currentGIF,
  });
});

app.post("/select-gif", express.json(), (req, res) => {
  const { name } = req.body;
  if (!uploadedGIFs.has(name)) return res.status(404).json({ error: "GIF not found" });
  currentGIF = name;
  currentFrameIndex = 0;
  broadcastList();
  res.json({ success: true, currentGIF });
});

app.post("/delete-gif", express.json(), (req, res) => {
  const { name } = req.body;
  if (!uploadedGIFs.has(name)) return res.status(404).json({ error: "GIF not found" });
  uploadedGIFs.delete(name);
  if (currentGIF === name) {
    currentGIF = uploadedGIFs.size > 0 ? Array.from(uploadedGIFs.keys())[0] : null;
    currentFrameIndex = 0;
  }
  broadcastList();
  res.json({ success: true, allGIFs: Array.from(uploadedGIFs.keys()), currentGIF });
});

app.post("/play", express.json(), (req, res) => {
  if (!currentGIF || !uploadedGIFs.has(currentGIF)) {
    return res.status(400).json({ error: "No GIF selected" });
  }
  res.json({ success: true, message: "Playback acknowledged", currentGIF });
});

const ticker = new Ticker({ fps: Math.max(1, FPS || 15) });

ticker.start(({ deltaTime, elapsedTime }) => {
  if (!currentGIF || !uploadedGIFs.has(currentGIF)) return;

  const gifData = uploadedGIFs.get(currentGIF);
  const frame = gifData.frames[currentFrameIndex];

  const frameCanvas = createCanvas(frame.dims.width, frame.dims.height);
  const frameCtx = frameCanvas.getContext("2d");
  const frameImageData = frameCtx.createImageData(frame.dims.width, frame.dims.height);
  frameImageData.data.set(frame.patch);
  frameCtx.putImageData(frameImageData, 0, 0);

  const outCanvas = createCanvas(width, height);
  const outCtx = outCanvas.getContext("2d");
  outCtx.drawImage(frameCanvas, 0, 0, width, height);

  const imageData = outCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = brightness > 127 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = binary;
    data[i + 3] = 255;
  }
  outCtx.putImageData(imageData, 0, 0);

  broadcastFrame(imageData);

  if (!IS_DEV) {
    display.setImageData(imageData);
    if (display.isDirty()) display.flush();
  } else {
    const filename = path.join(outputDir, "frame.png");
    fs.writeFileSync(filename, outCanvas.toBuffer("image/png"));
  }

  currentFrameIndex = (currentFrameIndex + 1) % gifData.frames.length;
});

  server.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
  });