// Canvas dimensions
export const CANVAS_WIDTH = 80;
export const CANVAS_HEIGHT = 20;

// Bresenham's line algorithm for continuous brush strokes
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): number[] {
  const points: number[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  
  while (true) {
    points.push(y * CANVAS_WIDTH + x);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return points;
}

// Draw ellipse using midpoint algorithm
export function drawEllipse(cx: number, cy: number, rx: number, ry: number): number[] {
  const points: number[] = [];
  
  // Handle degenerate cases
  if (rx === 0 && ry === 0) return [cy * CANVAS_WIDTH + cx];
  if (rx === 0) {
    for (let y = -ry; y <= ry; y++) {
      const py = cy + y;
      if (py >= 0 && py < CANVAS_HEIGHT) points.push(py * CANVAS_WIDTH + cx);
    }
    return points;
  }
  if (ry === 0) {
    for (let x = -rx; x <= rx; x++) {
      const px = cx + x;
      if (px >= 0 && px < CANVAS_WIDTH) points.push(cy * CANVAS_WIDTH + px);
    }
    return points;
  }
  
  // Midpoint ellipse algorithm
  let x = 0, y = ry;
  const rx2 = rx * rx, ry2 = ry * ry;
  let px = 0, py = 2 * rx2 * y;
  
  const plot = (xp: number, yp: number) => {
    if (xp >= 0 && xp < CANVAS_WIDTH && yp >= 0 && yp < CANVAS_HEIGHT) {
      points.push(yp * CANVAS_WIDTH + xp);
    }
  };
  
  // Region 1
  let p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2));
  while (px < py) {
    x++; px += 2 * ry2;
    if (p < 0) { p += ry2 + px; }
    else { y--; py -= 2 * rx2; p += ry2 + px - py; }
    plot(cx + x, cy + y); plot(cx - x, cy + y);
    plot(cx + x, cy - y); plot(cx - x, cy - y);
  }
  
  // Region 2
  p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2);
  while (y >= 0) {
    y--; py -= 2 * rx2;
    if (p > 0) { p += rx2 - py; }
    else { x++; px += 2 * ry2; p += rx2 - py + px; }
    plot(cx + x, cy + y); plot(cx - x, cy + y);
    plot(cx + x, cy - y); plot(cx - x, cy - y);
  }
  
  return points;
}
