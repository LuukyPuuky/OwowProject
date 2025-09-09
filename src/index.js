import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
import "./preview.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_DEV = process.argv.includes("--dev");

// Create display
const display = new Display({
    layout: LAYOUT,
    panelWidth: 28,
    isMirrored: true,
    transport: !IS_DEV ? {
        type: 'serial',
        path: '/dev/ttyACM0',
        baudRate: 57600
    } : {
        type: 'ip',
        host: '127.0.0.1',
        port: 3000
    }
});

const { width, height } = display;

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, "../output");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Register fonts
registerFont(
    path.resolve(__dirname, "../fonts/OpenSans-Variable.ttf"),
    { family: "OpenSans" },
);
registerFont(
    path.resolve(__dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
    { family: "PPNeueMontreal" },
);
registerFont(
    path.resolve(__dirname, "../fonts/Px437_ACM_VGA.ttf"),
    { family: "Px437_ACM_VGA" },
);

// Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
ctx.font = "18px monospace";
ctx.textBaseline = "top";

// Animation selection logic
const animFile = path.join(process.cwd(), "mood.txt");
function getAnimType() {
    try {
        return fs.readFileSync(animFile, "utf8").trim() || "bounce";
    } catch {
        return "bounce";
    }
}

// Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const anim = getAnimType();

    if (anim === "bounce") {
        // Bouncing ball
        const ballSize = 8;
        const x = Math.floor(((Math.sin(elapsedTime / 500) + 1) / 2) * (width - ballSize));
        const y = Math.floor(((Math.cos(elapsedTime / 700) + 1) / 2) * (height - ballSize));
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + ballSize / 2, y + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (anim === "wave") {
        // Sine wave
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x / width) * Math.PI * 4 + elapsedTime / 400) * (height / 4);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    } else if (anim === "blink") {
        // Blinking rectangle
        const on = Math.floor(elapsedTime / 500) % 2 === 0;
        ctx.fillStyle = on ? "#fff" : "#000";
        ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
    } else if (anim === "rain") {
        // Rain drops
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor((elapsedTime / 5 + i * 20) % height);
            ctx.fillRect(x, y, 2, 6);
        }
    } else if (anim === "clock") {
        // Digital clock
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        ctx.font = `${Math.floor(height * 0.6)}px "PPNeueMontreal", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(timeStr, width / 2, height / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
    } else if (anim === "calendar") {
        // Date display
        const now = new Date();
        const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        ctx.font = `${Math.floor(height * 0.35)}px "PPNeueMontreal", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(dateStr, width / 2, height / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
    }

    // Convert image to binary (purely black and white) for flipdot display
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
});