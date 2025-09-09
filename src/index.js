import { Ticker } from "./ticker.js";
import { createCanvas, registerFont } from "canvas";
import fs from "node:fs";
import path from "node:path";
import { FPS, LAYOUT } from "./settings.js";
import { Display } from "@owowagency/flipdot-emu";
// Keep side-effect import for parity with Casper's structure
import "./preview.js";
// Also import the helper we expose for our features
import { getMajorityMood } from "./preview.js";
import http from "node:http";
import { fileURLToPath } from "node:url";

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

// 1. Create output directory if it doesn't exist
const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// 2. Register fonts
// Resolve current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

registerFont(
	path.resolve(__dirname, "../fonts/OpenSans-Variable.ttf"),
	{ family: "OpenSans" },
);
registerFont(
	path.resolve(__dirname, "../fonts/PPNeueMontrealMono-Regular.ttf"),
	{ family: "PPNeueMontreal" },
);
registerFont(path.resolve(__dirname, "../fonts/Px437_ACM_VGA.ttf"), {
	family: "Px437_ACM_VGA",
});

// 3. Create canvas with the specified resolution
const canvas = createCanvas(width, height);
const ctx = canvas.getContext("2d");

// Disable anti-aliasing and image smoothing
ctx.imageSmoothingEnabled = false;
// Set a pixel-perfect monospace font
ctx.font = "18px monospace";
// Align text precisely to pixel boundaries
ctx.textBaseline = "top";

// 4. Initialize the ticker at x frames per second
const ticker = new Ticker({ fps: FPS });

// Helper: Draw a big dot-matrix style smiley (😃) on the canvas
// White face, black eyes and mouth, with teeth; all monochrome, crisp for flipdots
function drawSmiley({ ctx, width, height, elapsedTime }) {
	// Animation: subtle pulse (scale 0.95–1.05)
	const pulse = 1 + Math.sin(elapsedTime / 900) * 0.05;

	// Compute centered square area to place the face
	const size = Math.min(width, height) * 0.9 * pulse;
	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const r = size / 2;

	// Face (white filled circle)
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();

	// Eyes (black)
	// Slight bounce on Y for a friendly vibe
	const eyeBounce = Math.sin(elapsedTime / 700) * (r * 0.02);
	const eyeOffsetX = r * 0.38;
	const eyeOffsetY = r * 0.25 + eyeBounce;
	const eyeRadius = Math.max(1, r * 0.09);
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.fill();

	// Mouth (black rounded rect-ish)
	// Animate smile curvature (bigger/smaller)
	const t = (Math.sin(elapsedTime / 1200) + 1) / 2; // 0..1
	const mouthWidth = r * 1.1;
	const mouthY = cy + r * 0.28;
	const x1 = cx - mouthWidth / 2;
	const x2 = cx + mouthWidth / 2;
	const curveDepth = r * (0.08 + t * 0.25); // how big the smile is

	ctx.strokeStyle = "#000";
	ctx.lineWidth = Math.max(1, r * 0.16);
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x1, mouthY);
	ctx.quadraticCurveTo(cx, mouthY + curveDepth, x2, mouthY);
	ctx.stroke();
}

// Helper: Draw a sad face (🙁)
function drawSad({ ctx, width, height, elapsedTime }) {
	const pulse = 1 + Math.sin(elapsedTime / 1100) * 0.04;
	const size = Math.min(width, height) * 0.9 * pulse;
	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const r = size / 2;

	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();

	const eyeBounce = Math.sin(elapsedTime / 700) * (r * 0.02);
	const eyeOffsetX = r * 0.38;
	const eyeOffsetY = r * 0.25 + eyeBounce;
	const eyeRadius = Math.max(1, r * 0.09);
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.fill();

	// Inverted mouth (frown) with animated curvature
	const t = (Math.sin(elapsedTime / 1200) + 1) / 2; // 0..1
	const mouthWidth = r * 1.1;
	const mouthY = cy + r * 0.15; // slightly higher than smile
	const x1 = cx - mouthWidth / 2;
	const x2 = cx + mouthWidth / 2;
	const curveDepth = r * (0.08 + t * 0.25);

	ctx.strokeStyle = "#000";
	ctx.lineWidth = Math.max(1, r * 0.16);
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x1, mouthY);
	ctx.quadraticCurveTo(cx, mouthY - curveDepth, x2, mouthY);
	ctx.stroke();
}

// Helper: Draw a neutral face (😐)
function drawNeutral({ ctx, width, height, elapsedTime }) {
	const pulse = 1 + Math.sin(elapsedTime / 1300) * 0.02;
	const size = Math.min(width, height) * 0.9 * pulse;
	const cx = Math.floor(width / 2);
	const cy = Math.floor(height / 2);
	const r = size / 2;

	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();

	const eyeOffsetX = r * 0.38;
	const eyeOffsetY = r * 0.25;
	const eyeRadius = Math.max(1, r * 0.09);
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
	ctx.fill();

	// Flat mouth
	const mouthWidth = r * 1.1;
	const mouthY = cy + r * 0.28;
	const x1 = cx - mouthWidth / 2;
	const x2 = cx + mouthWidth / 2;
	ctx.strokeStyle = "#000";
	ctx.lineWidth = Math.max(1, r * 0.16);
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(x1, mouthY);
	ctx.lineTo(x2, mouthY);
	ctx.stroke();
}

// Scene selection via env var; default to 'mood'. Options: 'mood' | 'clock' | 'demo2' | 'tally'
let SCENE = process.env.SCENE ? String(process.env.SCENE).toLowerCase() : 'mood';
let __lastSceneCheck = 0;
async function fetchActiveScene(){
    const now = Date.now();
    if (now - __lastSceneCheck < 400) return SCENE; // throttle ~2.5Hz
    __lastSceneCheck = now;
    try{
        const { scene } = await new Promise(resolve => {
            const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/scene', method: 'GET' }, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(data||'{}')); } catch { resolve({}); }
                });
            });
            req.on('error', () => resolve({}));
            req.end();
        });
        if (scene === 'mood' || scene === 'clock' || scene === 'demo2' || scene === 'tally') SCENE = scene;
    }catch{}
    return SCENE;
}

// Simple scenes registry
function renderScene({ scene, ctx, width, height, elapsedTime }) {
	if (scene === 'clock') {
		ctx.fillStyle = '#fff';
		const now = new Date();
		const hh = String(now.getHours()).padStart(2, '0');
		const mm = String(now.getMinutes()).padStart(2, '0');
		const ss = String(now.getSeconds()).padStart(2, '0');
		const text = `${hh}:${mm}:${ss}`;
		// Auto-scale font to fit width with small margin
		const baseSize = 24;
		ctx.font = `${baseSize}px PPNeueMontreal`;
		let metrics = ctx.measureText(text);
		const marginX = 4;
		const availableWidth = Math.max(1, width - marginX * 2);
		let scale = Math.min(1, availableWidth / Math.max(1, metrics.width));
		let fontSize = Math.max(12, Math.floor(baseSize * scale));
		ctx.font = `${fontSize}px PPNeueMontreal`;
		metrics = ctx.measureText(text);
		const x = Math.max(marginX, Math.floor((width - metrics.width) / 2));
		const y = Math.floor(height / 2 - fontSize / 2);
		ctx.fillText(text, x, y);
		return;
	}

	if (scene === 'demo2') {
		ctx.fillStyle = '#fff';
		ctx.font = '18px Px437_ACM_VGA';
		const text = 'Demo 2';
		const metrics = ctx.measureText(text);
		const x = Math.max(0, Math.floor((width - metrics.width) / 2));
		const y = Math.floor(height / 2 - 9);
		ctx.fillText(text, x, y);
		return;
	}

	if (scene === 'tally') {
		// will be handled in main loop (fetches server scores)
		return;
	}

    // no-op for other scenes

	// default scene: mood faces
	const { majority } = getMajorityMood();
	if (majority === 'sad') {
		drawSad({ ctx, width, height, elapsedTime });
	} else if (majority === 'neutral') {
		drawNeutral({ ctx, width, height, elapsedTime });
	} else {
		drawSmiley({ ctx, width, height, elapsedTime });
	}
}

ticker.start(async ({ deltaTime, elapsedTime }) => {
	// Clear the console
	console.clear();
	console.time("Write frame");
	console.log(`Rendering a ${width}x${height} canvas`);
	console.log("View at http://localhost:3000/view");

	ctx.clearRect(0, 0, width, height);

	// Fill the canvas with a black background
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, width, height);

	// Render scene based on current selection
	const currentScene = await fetchActiveScene();
	if (currentScene === 'tally') {
		// fetch tally game state
		const { a, b, lastTs } = await new Promise(resolve => {
			const req = http.request({ hostname: '127.0.0.1', port: 3000, path: '/tallygame', method: 'GET' }, res => {
				let data = '';
				res.on('data', c => data += c);
				res.on('end', () => {
					try {
						const j = JSON.parse(data || '{}');
						resolve({ a: Number(j.a)||0, b: Number(j.b)||0, lastTs: Number(j.lastTs)||0 });
					} catch { resolve({ a:0, b:0, lastTs:0 }); }
				});
			});
			req.on('error', ()=>resolve({ a:0, b:0, lastTs:0 }));
			req.end();
		});

		// render large numeric scores instead of tallies
		const pad = 6;
		const half = Math.floor(width / 2);
		const leftBox = { x: 0, y: 0, w: half, h: height };
		const rightBox = { x: half, y: 0, w: width - half, h: height };

		function drawScore(box, value){
			const text = String(value);
			// auto-fit font size within the box with margins
			let base = Math.max(12, Math.floor(Math.min(box.w, box.h) * 0.8));
			ctx.fillStyle = '#fff';
			let size = base;
			ctx.font = `${size}px PPNeueMontreal`;
			let metrics = ctx.measureText(text);
			const maxW = Math.max(1, box.w - pad * 2);
			const maxH = Math.max(1, box.h - pad * 2);
			// scale down if needed
			if (metrics.width > maxW || size > maxH){
				const scaleW = maxW / Math.max(1, metrics.width);
				const scaleH = maxH / Math.max(1, size);
				size = Math.max(12, Math.floor(size * Math.min(scaleW, scaleH)));
				ctx.font = `${size}px PPNeueMontreal`;
				metrics = ctx.measureText(text);
			}
			const x = box.x + Math.floor((box.w - metrics.width) / 2);
			const y = Math.floor((box.h - size) / 2);
			ctx.fillText(text, x, y);
		}

		drawScore(leftBox, a);
		drawScore(rightBox, b);

		// optional center divider
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(half + 0.5, 0);
		ctx.lineTo(half + 0.5, height);
		ctx.stroke();

		// shockwave when score changes
		if (lastTs) {
			const age = (elapsedTime - lastTs);
			if (age >= 0 && age < 1200) {
				const progress = age / 1200;
				const radius = Math.sqrt(width*width + height*height) * progress;
				const alpha = 1 - progress;
				ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, alpha))})`;
				ctx.lineWidth = 2 + 6 * (1 - progress);
				ctx.beginPath();
				ctx.arc(Math.floor(width/2), Math.floor(height/2), radius, 0, Math.PI*2);
				ctx.stroke();
			}
		}
	} else {
		renderScene({ scene: currentScene, ctx, width, height, elapsedTime });
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
