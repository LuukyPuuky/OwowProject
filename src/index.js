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

// Disable anti-aliasing and image smoothing for crisp pixels
ctx.imageSmoothingEnabled = false;

// Coding quotes collection
const CODING_QUOTES = [
  { text: "A good coder borrows, a great coder steals" },
  { text: "Code is like humor. When you have to explain it, it's bad" },
  { text: "First, solve the problem. Then, write the code" },
  { text: "The best error message is the one that never shows up" },
  {
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand",
  },
  { text: "Talk is cheap. Show me the code" },
  { text: "Code never lies, comments sometimes do" },
  { text: "Programming is thinking, not typing" },
  {
    text: "The only way to learn a new programming language is by writing programs in it",
  },
  { text: "Simplicity is the ultimate sophistication" },
];

// Animation modes
const ANIMATION_MODE = {
  SCROLLING: "scrolling",
  FADE_IN: "fade_in",
  DISPLAY: "display",
  FADE_OUT: "fade_out",
};

// Animation configuration
const SCROLL_SPEED = 1000; // Pixels per second
const FADE_DURATION = 100; // Milliseconds for fade in/out
const DISPLAY_DURATION = 1000; // Milliseconds to display quote after fade-in
const PAUSE_AFTER_SCROLL_DURATION = 1500; // Milliseconds to pause after scroll

let currentQuoteIndex = 0;
let currentAnimationMode = ANIMATION_MODE.SCROLLING;
let modeStartTime = 0; // Timestamp when the current animation mode started
let scrollOffset = width; // Start off-screen to the right

// Function to render scrolling text
function renderScrollingText(quote, offset) {
  ctx.font = "12px PPNeueMontreal";
  ctx.fillStyle = "#fff";
  const text = `${quote.text}`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const fontSize = 12;
  ctx.textBaseline = "middle";
  // Center text vertically
  const y = height / 2;
  ctx.fillText(text, offset, y);
  return textWidth;
}

// Text wrapping function
function wrapText(text, maxWidth, fontSize) {
  ctx.font = `${fontSize}px PPNeueMontreal`;
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, force it on its own line
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Function to render text with fade effect
function renderQuoteWithFade(quote, fadeOpacity) {
  const margin = 8;
  const maxTextWidth = width - margin * 2;

  // Try different font sizes to find the best fit
  let fontSize = 10;
  let lines = [];

  // Find optimal font size for quote text
  for (let size = 14; size >= 8; size--) {
    lines = wrapText(quote.text, maxTextWidth, size);
    const totalHeight = lines.length * size * 1.2 + 8;
    if (totalHeight <= height - margin * 2) {
      fontSize = size;
      break;
    }
  }

  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight + 8;
  // Center block of text vertically
  const startY = (height - totalTextHeight) / 2;

  // Create a temporary canvas for fade effect
  const tempCanvas = createCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.imageSmoothingEnabled = false;

  // Render quote text
  tempCtx.fillStyle = "#fff";
  tempCtx.font = `${fontSize}px PPNeueMontreal`;
  tempCtx.textBaseline = "middle";

  lines.forEach((line, index) => {
    const textWidth = tempCtx.measureText(line).width;
    const x = (width - textWidth) / 2;
    // Center each line in the block
    const y = startY + index * lineHeight + lineHeight / 2;
    tempCtx.fillText(line, x, y);
  });

  // Apply fade effect by manipulating pixel data
  if (fadeOpacity < 1) {
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 0) {
        // If pixel is white
        // Apply random dither based on opacity
        const shouldKeep = Math.random() < fadeOpacity;
        if (!shouldKeep) {
          data[i] = 0; // R
          data[i + 1] = 0; // G
          data[i + 2] = 0; // B
        }
      }
    }
    tempCtx.putImageData(imageData, 0, 0);
  }

  // Draw the temporary canvas onto the main canvas
  ctx.drawImage(tempCanvas, 0, 0);
}

// Initialize the ticker
const ticker = new Ticker({ fps: FPS });

ticker.start(({ deltaTime, elapsedTime }) => {
  // Clear the console
  console.clear();
  console.time("Write frame");
  console.log(`Rendering a ${width}x${height} canvas`);
  console.log("View at http://localhost:3000/view");

  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  const currentQuote = CODING_QUOTES[currentQuoteIndex];
  const timeInCurrentMode = elapsedTime - modeStartTime;

  switch (currentAnimationMode) {
    case ANIMATION_MODE.SCROLLING: {
      scrollOffset -= SCROLL_SPEED * (deltaTime / 1000); // Convert speed to pixels per millisecond
      const textWidth = renderScrollingText(currentQuote, scrollOffset);

      // Check if text has completely scrolled off screen
      if (scrollOffset < -textWidth) {
        // Pause after scrolling
        currentAnimationMode = ANIMATION_MODE.PAUSE_AFTER_SCROLL;
        modeStartTime = elapsedTime;
      }
      break;
    }

    case ANIMATION_MODE.PAUSE_AFTER_SCROLL: {
      // Keep the screen blank or show the last frame of the scroll
      // For now, let's just show the last visible part of the scroll, or blank if it's off-screen
      // A more robust solution might show a static image during pause.
      if (timeInCurrentMode >= PAUSE_AFTER_SCROLL_DURATION) {
        currentAnimationMode = ANIMATION_MODE.FADE_IN;
        modeStartTime = elapsedTime;
      }
      break;
    }

    case ANIMATION_MODE.FADE_IN: {
      let fadeProgress = timeInCurrentMode / FADE_DURATION;
      if (fadeProgress >= 1) {
        fadeProgress = 1;
        currentAnimationMode = ANIMATION_MODE.DISPLAY;
        modeStartTime = elapsedTime;
      }
      renderQuoteWithFade(currentQuote, fadeProgress);
      break;
    }

    case ANIMATION_MODE.DISPLAY: {
      if (timeInCurrentMode >= DISPLAY_DURATION) {
        currentAnimationMode = ANIMATION_MODE.FADE_OUT;
        modeStartTime = elapsedTime;
      }
      renderQuoteWithFade(currentQuote, 1); // Fully opaque during display
      break;
    }

    case ANIMATION_MODE.FADE_OUT: {
      let fadeProgress = 1 - timeInCurrentMode / FADE_DURATION;
      if (fadeProgress <= 0) {
        fadeProgress = 0;
        // Move to next quote and restart scrolling
        currentQuoteIndex = (currentQuoteIndex + 1) % CODING_QUOTES.length;
        currentAnimationMode = ANIMATION_MODE.SCROLLING;
        modeStartTime = elapsedTime;
        scrollOffset = width; // Reset scroll position for the new quote
      }
      renderQuoteWithFade(currentQuote, fadeProgress);
      break;
    }
  }

  // Convert to binary for flipdot display
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const binary = brightness > 127 ? 255 : 0;
    data[i] = binary; // R
    data[i + 1] = binary; // G
    data[i + 2] = binary; // B
    data[i + 3] = 255; // A
  }

  ctx.putImageData(imageData, 0, 0);

  // Output to file or display
  if (IS_DEV) {
    const filename = path.join(outputDir, "frame.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filename, buffer);
  } else {
    const displayImageData = ctx.getImageData(
      0,
      0,
      display.width,
      display.height
    );
    display.setImageData(displayImageData);
    if (display.isDirty()) {
      display.flush();
    }
  }

  console.log(`Current Quote: "${currentQuote.text}"`);
  console.log(`Animation Mode: ${currentAnimationMode}`);
  console.log(`Scroll Offset: ${scrollOffset.toFixed(1)}`);
  console.log(`Quote ${currentQuoteIndex + 1}/${CODING_QUOTES.length}`);
  console.log(`Elapsed time: ${(elapsedTime / 1000).toFixed(2)}s`);
  console.log(`Time in mode: ${(timeInCurrentMode / 1000).toFixed(2)}s`);
  console.log(`Delta time: ${deltaTime.toFixed(2)}ms`);
  console.timeEnd("Write frame");
});
