// filepath: c:\open_learn\semester_2\personal project\ghit\OwowProject\src\billboard.js
import { createCanvas } from "canvas";
import { LAYOUT } from "./settings.js";

export function renderBillboard() {
  const cellSize = 64;
  const rows = LAYOUT.length;
  const cols = LAYOUT[0].length;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, width, height);

  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const value = LAYOUT[y][x];
      ctx.fillStyle = "#444";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = "#888";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);

      ctx.fillStyle = "#fff";
      ctx.fillText(
        value,
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2
      );
    }
  }

  return canvas.toBuffer("image/png");
}