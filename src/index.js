import express from "express";
import multer from "multer";
import { createCanvas, loadImage } from "canvas";
import fs from "node:fs";
import path from "node:path";
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

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Load and resize image
    const img = await loadImage(filePath);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, width, height);

    // Convert to black & white
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

    // Save image for preview
    const outPath = path.join(outputDir, "uploaded.png");
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

    if (!IS_DEV) {
      // Send to flipdot hardware
      display.setImageData(imageData);
      if (display.isDirty()) {
        display.flush();
      }
    }

    // Redirect back to homepage to show image
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing image: " + err.message);
  }
});

// Home page with upload + preview
app.get("/", (req, res) => {
  res.send(`
    <h1>Flipdot Image Uploader</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="image" />
      <button type="submit">Upload</button>
    </form>
    <h2>Latest Uploaded Image:</h2>
    <img src="/output/uploaded.png?${Date.now()}" alt="Uploaded Image" style="border:1px solid #333; max-width:100%;" />
  `);
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Flipdot image uploader running at http://localhost:${PORT}`);
});
