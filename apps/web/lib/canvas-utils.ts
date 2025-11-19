// Bresenham's line algorithm for continuous brush strokes
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): number[] {
  const points: number[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  const W = 84; // grid width
  
  while (true) {
    points.push(y * W + x);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return points;
}

// Draw ellipse using midpoint algorithm
export function drawEllipse(cx: number, cy: number, rx: number, ry: number): number[] {
  const W = 84;
  const H = 28;
  const points: number[] = [];
  
  // Handle degenerate cases
  if (rx === 0 && ry === 0) return [cy * W + cx];
  if (rx === 0) {
    for (let y = -ry; y <= ry; y++) {
      const py = cy + y;
      if (py >= 0 && py < H) points.push(py * W + cx);
    }
    return points;
  }
  if (ry === 0) {
    for (let x = -rx; x <= rx; x++) {
      const px = cx + x;
      if (px >= 0 && px < W) points.push(cy * W + px);
    }
    return points;
  }
  
  // Midpoint ellipse algorithm
  let x = 0, y = ry;
  const rx2 = rx * rx, ry2 = ry * ry;
  let px = 0, py = 2 * rx2 * y;
  
  const plot = (xp: number, yp: number) => {
    if (xp >= 0 && xp < W && yp >= 0 && yp < H) points.push(yp * W + xp);
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

export function drawArrow(x0: number, y0: number, x1: number, y1: number): number[] {
  const points: number[] = [];
  
  // Arrow: line + arrowhead
  const line = bresenhamLine(x0, y0, x1, y1);
  points.push(...line);
  
  // Arrowhead (simple triangle at end)
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len > 3) {
    const ndx = dx / len;
    const ndy = dy / len;
    const arrowSize = Math.min(5, len / 3);
    
    // Perpendicular vector
    const px = -ndy;
    const py = ndx;
    
    // Two points for arrowhead
    const ax1 = Math.round(x1 - ndx * arrowSize + px * arrowSize * 0.5);
    const ay1 = Math.round(y1 - ndy * arrowSize + py * arrowSize * 0.5);
    const ax2 = Math.round(x1 - ndx * arrowSize - px * arrowSize * 0.5);
    const ay2 = Math.round(y1 - ndy * arrowSize - py * arrowSize * 0.5);
    
    points.push(...bresenhamLine(x1, y1, ax1, ay1));
    points.push(...bresenhamLine(x1, y1, ax2, ay2));
  }
  
  return points;
}

export function bitsOf(arr: boolean[]): string {
  return arr.map(v => v ? '1' : '0').join('');
}

export function arrOf(bits: string, size: number): boolean[] {
  const arr = new Array(size).fill(false);
  for (let i = 0; i < arr.length && i < bits.length; i++) {
    arr[i] = bits.charAt(i) === '1';
  }
  return arr;
}
