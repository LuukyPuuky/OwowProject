import express from "express";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";
import path from "node:path";
import pkg from "gifuct-js";
const { parseGIF, decompressFrames } = pkg;
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";

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

// Ensure output dir exists
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Express setup
const app = express();
const upload = multer({ dest: "uploads/" });

// Serve static files from output directory
app.use("/output", express.static(outputDir));


// UPLOAD ROUTE — supports PNG, JPG, and GIF (animated)

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const isGif = req.file.mimetype === "image/gif";

     if (isGif) {
        console.log("Processing animated GIF...");
        const gif = parseGIF(buffer);
        const frames = decompressFrames(gif, true);

        // Create a master canvas with the GIF logical screen size so we can
        // compose frames according to their dims and disposal methods.
        const gifWidth = gif.lsd.width;
        const gifHeight = gif.lsd.height;
        const masterCanvas = createCanvas(gifWidth, gifHeight);
        const masterCtx = masterCanvas.getContext("2d");

        let savedImageData = null; // for disposalType === 3 (restore to previous)

        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];

          // If disposalType === 3 we must be able to restore the canvas state
          if (frame.disposalType === 3) {
            savedImageData = masterCtx.getImageData(0, 0, gifWidth, gifHeight);
          }

          // Draw the frame patch onto the master canvas at the frame offsets
          const frameCanvas = createCanvas(frame.dims.width, frame.dims.height);
          const frameCtx = frameCanvas.getContext("2d");
          const frameImageData = frameCtx.createImageData(frame.dims.width, frame.dims.height);
          frameImageData.data.set(frame.patch);
          frameCtx.putImageData(frameImageData, 0, 0);

          // Put the frame patch into master canvas at correct position
          masterCtx.putImageData(frameImageData, frame.dims.left, frame.dims.top);

          // Process (scale/dither) the composed master canvas to your display size
          const processedCanvas = await processFrame(masterCanvas, width, height);

          // Save frame to output for debugging
          const framePath = path.join(outputDir, `frame_${i}.png`);
          fs.writeFileSync(framePath, processedCanvas.toBuffer("image/png"));

          // Send to flipdot
          if (!IS_DEV) {
            const ctx = processedCanvas.getContext("2d");
            const imageData = ctx.getImageData(0, 0, width, height);
            display.setImageData(imageData);
            if (display.isDirty()) display.flush();
          }

          // Wait the GIF frame delay (frame.delay is in hundredths of a second)
          const delayCs = frame.delay || 10; // default 100ms if missing
          await new Promise((r) => setTimeout(r, delayCs * 10));

          // Apply disposal after the frame has been shown
          if (frame.disposalType === 2) {
            // restore to background: clear the frame area
            masterCtx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
          } else if (frame.disposalType === 3 && savedImageData) {
            // restore to previous
            masterCtx.putImageData(savedImageData, 0, 0);
            savedImageData = null;
          }
        }
    } else {
      console.log("Processing static image...");
      const img = await loadImage(filePath);
      const processedCanvas = await processFrame(img, width, height);
      const outPath = path.join(outputDir, "uploaded.png");
      fs.writeFileSync(outPath, processedCanvas.toBuffer("image/png"));

      if (!IS_DEV) {
        const ctx = processedCanvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, width, height);
        display.setImageData(imageData);
        if (display.isDirty()) display.flush();
      }
    }

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing image: " + err.message);
  }
});


//IMAGE PROCESSING + DITHERING HELPERS


// Resize, center, adjust, dither
async function processFrame(imageOrCanvas, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Maintain aspect ratio
  const img = imageOrCanvas;
  const imgAspect = img.width / img.height;
  const displayAspect = width / height;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (imgAspect > displayAspect) {
    drawWidth = width;
    drawHeight = width / imgAspect;
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  } else {
    drawHeight = height;
    drawWidth = height * imgAspect;
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  }

  // Slight contrast & brightness boost
  ctx.filter = "contrast(1.3) brightness(1.1)";
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  ctx.filter = "none";

  const imageData = ctx.getImageData(0, 0, width, height);
  applyDithering(imageData);
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// Jarvis–Judice–Ninke dithering
function applyDithering(imageData) {
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const oldPixel = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const newPixel = oldPixel < 128 ? 0 : 255;
      const error = oldPixel - newPixel;

      data[i] = data[i + 1] = data[i + 2] = newPixel;

      const distribute = (dx, dy, factor) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return;
        const ni = (ny * width + nx) * 4;
        for (let c = 0; c < 3; c++) {
          data[ni + c] += error * factor;
        }
      };

      // Jarvis–Judice–Ninke error diffusion
      distribute(1, 0, 7 / 48);
      distribute(2, 0, 5 / 48);
      distribute(-2, 1, 3 / 48);
      distribute(-1, 1, 5 / 48);
      distribute(0, 1, 7 / 48);
      distribute(1, 1, 5 / 48);
      distribute(2, 1, 3 / 48);
      distribute(-2, 2, 1 / 48);
      distribute(-1, 2, 3 / 48);
      distribute(0, 2, 5 / 48);
      distribute(1, 2, 3 / 48);
      distribute(2, 2, 1 / 48);
    }
  }
}

//HOME PAGE (UPLOAD + PREVIEW)
  
app.get("/", (req, res) => {
  res.send(`
    <h1>Flipdot Image/GIF Uploader</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" />
      <button type="submit">Upload</button>
    </form>
    <h2>Latest Uploaded:</h2>
    <img src="/output/uploaded.png?${Date.now()}" alt="Uploaded Image" style="border:1px solid #333; max-width:100%;" />
    <p>GIF frames (if any) saved under /output/frame_*.png</p>
  `);
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Flipdot image uploader running at http://localhost:${PORT}`);
});
