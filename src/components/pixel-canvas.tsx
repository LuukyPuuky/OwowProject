"use client";

import { useRef, useCallback, useEffect } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT, bresenhamLine, drawEllipse } from "@/lib/canvas";
import type { BrushMode, BrushShape, Tool } from "@/lib/types";

interface PixelCanvasProps {
  pixels: boolean[];
  onPixelsChange: (pixels: boolean[]) => void;
  brushSize: number;
  brushMode: BrushMode;
  brushShape: BrushShape;
  activeTool: Tool;
  onionSkin?: boolean[];
  cellSize?: number;
  showGrid?: boolean;
  selection?: { startX: number; startY: number; endX: number; endY: number } | null;
  onSelectionChange?: (selection: { startX: number; startY: number; endX: number; endY: number } | null) => void;
  isSelecting?: boolean;
  onSelectingChange?: (isSelecting: boolean) => void;
  onMousePosChange?: (pos: { x: number; y: number }) => void;
}

export function PixelCanvas({
  pixels,
  onPixelsChange,
  brushSize,
  brushMode,
  brushShape,
  activeTool,
  onionSkin,
  cellSize = 8,
  showGrid = true,
  selection,
  onSelectionChange,
  isSelecting,
  onSelectingChange,
  onMousePosChange,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isMouseDownRef = useRef(false);
  const lastMouseIndexRef = useRef(-1);
  const shapeStartIndexRef = useRef(-1);
  const shapePreviewRef = useRef<number[] | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize canvas context once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctxRef.current = canvas.getContext('2d', { alpha: false });
  }, []);

  // Optimized render function - doesn't recreate on every pixel change
  const renderCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw pixels
    for (let i = 0; i < pixels.length; i++) {
      const x = i % CANVAS_WIDTH;
      const y = Math.floor(i / CANVAS_WIDTH);
      
      // Onion skin (draw first, so it's behind)
      if (onionSkin && onionSkin[i] && !pixels[i]) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
      
      // Current pixel
      if (pixels[i]) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw shape preview
    if (shapePreviewRef.current) {
      ctx.fillStyle = brushMode === 'paint' ? '#999999' : '#444444';
      shapePreviewRef.current.forEach(i => {
        const x = i % CANVAS_WIDTH;
        const y = Math.floor(i / CANVAS_WIDTH);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    }

    // Draw selection rectangle
    if (selection) {
      const minX = Math.min(selection.startX, selection.endX);
      const maxX = Math.max(selection.startX, selection.endX);
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);

      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(
        minX * cellSize - 1,
        minY * cellSize - 1,
        (maxX - minX + 1) * cellSize + 2,
        (maxY - minY + 1) * cellSize + 2
      );
      ctx.setLineDash([]);

      // Draw semi-transparent overlay outside selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      
      // Top
      if (minY > 0) {
        ctx.fillRect(0, 0, CANVAS_WIDTH * cellSize, minY * cellSize);
      }
      // Bottom
      if (maxY < CANVAS_HEIGHT - 1) {
        ctx.fillRect(0, (maxY + 1) * cellSize, CANVAS_WIDTH * cellSize, (CANVAS_HEIGHT - maxY - 1) * cellSize);
      }
      // Left
      if (minX > 0) {
        ctx.fillRect(0, minY * cellSize, minX * cellSize, (maxY - minY + 1) * cellSize);
      }
      // Right
      if (maxX < CANVAS_WIDTH - 1) {
        ctx.fillRect((maxX + 1) * cellSize, minY * cellSize, (CANVAS_WIDTH - maxX - 1) * cellSize, (maxY - minY + 1) * cellSize);
      }
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      
      // Draw vertical lines
      for (let x = 1; x < CANVAS_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, CANVAS_HEIGHT * cellSize);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 1; y < CANVAS_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(CANVAS_WIDTH * cellSize, y * cellSize);
        ctx.stroke();
      }
    }
  }, [pixels, onionSkin, cellSize, showGrid, brushMode, selection]);

  // Request animation frame render instead of immediate useEffect
  useEffect(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(() => {
      renderCanvas();
      animFrameRef.current = null;
    });
    
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [renderCanvas]);

  const getIndexFromMouseEvent = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return -1;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellWidth = rect.width / CANVAS_WIDTH;
    const cellHeight = rect.height / CANVAS_HEIGHT;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);
    
    // Track mouse position
    if (onMousePosChange && gridX >= 0 && gridY >= 0 && gridX < CANVAS_WIDTH && gridY < CANVAS_HEIGHT) {
      onMousePosChange({ x: gridX, y: gridY });
    }
    
    if (gridX < 0 || gridY < 0 || gridX >= CANVAS_WIDTH || gridY >= CANVAS_HEIGHT) return -1;
    return gridY * CANVAS_WIDTH + gridX;
  }, [onMousePosChange]);

  const applyBrushAt = useCallback((index: number, arr: boolean[]) => {
    const cx = index % CANVAS_WIDTH;
    const cy = Math.floor(index / CANVAS_WIDTH);
    const r = Math.max(0, brushSize - 1);
    
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= CANVAS_WIDTH || ny >= CANVAS_HEIGHT) continue;
        
        let inside = false;
        if (brushShape === 'circle') {
          inside = (dx * dx + dy * dy) <= r * r;
        } else if (brushShape === 'square') {
          inside = Math.abs(dx) <= r && Math.abs(dy) <= r;
        } else if (brushShape === 'triangle') {
          const yPrime = dy + r;
          if (yPrime >= 0 && yPrime <= 2 * r) {
            const halfWidth = Math.floor((yPrime / Math.max(1, 2 * r)) * r);
            inside = Math.abs(dx) <= halfWidth;
          }
        }
        
        if (!inside) continue;
        const pi = ny * CANVAS_WIDTH + nx;
        arr[pi] = (brushMode === 'paint');
      }
    }
  }, [brushSize, brushMode, brushShape]);

  const applyBrushLine = useCallback((fromIndex: number, toIndex: number, arr: boolean[]) => {
    const x0 = fromIndex % CANVAS_WIDTH;
    const y0 = Math.floor(fromIndex / CANVAS_WIDTH);
    const x1 = toIndex % CANVAS_WIDTH;
    const y1 = Math.floor(toIndex / CANVAS_WIDTH);
    const line = bresenhamLine(x0, y0, x1, y1);
    
    line.forEach(cellIdx => {
      applyBrushAt(cellIdx, arr);
    });
  }, [applyBrushAt]);

  const floodFill = useCallback((startIndex: number, arr: boolean[]) => {
    const targetColor = arr[startIndex];
    const fillColor = (brushMode === 'paint');
    if (targetColor === fillColor) return;
    
    const queue = [startIndex];
    const visited = new Set<number>();
    
    while (queue.length > 0) {
      const i = queue.shift()!;
      if (visited.has(i)) continue;
      if (i < 0 || i >= arr.length) continue;
      if (arr[i] !== targetColor) continue;
      
      visited.add(i);
      arr[i] = fillColor;
      
      const x = i % CANVAS_WIDTH;
      const y = Math.floor(i / CANVAS_WIDTH);
      
      if (x > 0) queue.push(i - 1);
      if (x < CANVAS_WIDTH - 1) queue.push(i + 1);
      if (y > 0) queue.push(i - CANVAS_WIDTH);
      if (y < CANVAS_HEIGHT - 1) queue.push(i + CANVAS_WIDTH);
    }
  }, [brushMode]);

  const drawShape = useCallback((startIndex: number, endIndex: number, toolType: Tool): number[] => {
    const x0 = startIndex % CANVAS_WIDTH;
    const y0 = Math.floor(startIndex / CANVAS_WIDTH);
    const x1 = endIndex % CANVAS_WIDTH;
    const y1 = Math.floor(endIndex / CANVAS_WIDTH);
    let points: number[] = [];
    
    if (toolType === 'line') {
      points = bresenhamLine(x0, y0, x1, y1);
    } else if (toolType === 'ellipse') {
      const cx = Math.floor((x0 + x1) / 2);
      const cy = Math.floor((y0 + y1) / 2);
      const rx = Math.abs(x1 - x0) / 2;
      const ry = Math.abs(y1 - y0) / 2;
      points = drawEllipse(cx, cy, Math.round(rx), Math.round(ry));
    } else if (toolType === 'rect') {
      const minX = Math.min(x0, x1);
      const maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1);
      const maxY = Math.max(y0, y1);
      
      for (let x = minX; x <= maxX; x++) {
        points.push(minY * CANVAS_WIDTH + x);
        points.push(maxY * CANVAS_WIDTH + x);
      }
      for (let y = minY; y <= maxY; y++) {
        points.push(y * CANVAS_WIDTH + minX);
        points.push(y * CANVAS_WIDTH + maxX);
      }
    }
    
    return points;
  }, []);

  const commitShape = useCallback((startIndex: number, endIndex: number) => {
    const points = drawShape(startIndex, endIndex, activeTool);
    const newArr = [...pixels];
    points.forEach(pi => {
      if (pi >= 0 && pi < newArr.length) {
        newArr[pi] = (brushMode === 'paint');
      }
    });
    onPixelsChange(newArr);
  }, [pixels, activeTool, brushMode, drawShape, onPixelsChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const index = getIndexFromMouseEvent(e);
    if (index < 0) return;
    
    isMouseDownRef.current = true;
    
    if (activeTool === 'select') {
      // Start selection
      const x = index % CANVAS_WIDTH;
      const y = Math.floor(index / CANVAS_WIDTH);
      if (onSelectionChange) {
        onSelectionChange({ startX: x, startY: y, endX: x, endY: y });
      }
      if (onSelectingChange) {
        onSelectingChange(true);
      }
      return;
    }
    
    if (activeTool === 'brush') {
      const newArr = [...pixels];
      applyBrushAt(index, newArr);
      onPixelsChange(newArr);
      lastMouseIndexRef.current = index;
    } else if (activeTool === 'fill') {
      const newArr = [...pixels];
      floodFill(index, newArr);
      onPixelsChange(newArr);
    } else {
      shapeStartIndexRef.current = index;
      shapePreviewRef.current = null;
    }
  }, [activeTool, pixels, getIndexFromMouseEvent, applyBrushAt, floodFill, onPixelsChange, onSelectionChange, onSelectingChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) {
      if (shapePreviewRef.current !== null) {
        shapePreviewRef.current = null;
        renderCanvas();
      }
      return;
    }
    
    const index = getIndexFromMouseEvent(e);
    if (index < 0) return;
    
    if (activeTool === 'select' && isSelecting && selection) {
      // Update selection end point
      const x = index % CANVAS_WIDTH;
      const y = Math.floor(index / CANVAS_WIDTH);
      if (onSelectionChange) {
        onSelectionChange({ ...selection, endX: x, endY: y });
      }
      return;
    }
    
    if (activeTool === 'brush') {
      const newArr = [...pixels];
      if (lastMouseIndexRef.current >= 0 && lastMouseIndexRef.current !== index) {
        applyBrushLine(lastMouseIndexRef.current, index, newArr);
      } else {
        applyBrushAt(index, newArr);
      }
      onPixelsChange(newArr);
      lastMouseIndexRef.current = index;
    } else if (activeTool !== 'fill') {
      if (shapeStartIndexRef.current >= 0) {
        shapePreviewRef.current = drawShape(shapeStartIndexRef.current, index, activeTool);
        renderCanvas();
      }
    }
  }, [activeTool, pixels, getIndexFromMouseEvent, applyBrushAt, applyBrushLine, drawShape, onPixelsChange, renderCanvas, isSelecting, selection, onSelectionChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current) return;
    
    const index = getIndexFromMouseEvent(e);
    
    if (activeTool === 'select' && onSelectingChange) {
      // Finish selection
      onSelectingChange(false);
      isMouseDownRef.current = false;
      return;
    }
    
    if (index >= 0 && activeTool !== 'brush' && activeTool !== 'fill' && activeTool !== 'select' && shapeStartIndexRef.current >= 0) {
      commitShape(shapeStartIndexRef.current, index);
      shapePreviewRef.current = null;
      shapeStartIndexRef.current = -1;
      renderCanvas();
    }
    
    isMouseDownRef.current = false;
    lastMouseIndexRef.current = -1;
  }, [activeTool, getIndexFromMouseEvent, commitShape, renderCanvas, onSelectingChange]);

  const handleMouseLeave = useCallback(() => {
    isMouseDownRef.current = false;
    lastMouseIndexRef.current = -1;
    if (shapePreviewRef.current !== null) {
      shapePreviewRef.current = null;
      renderCanvas();
    }
  }, [renderCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH * cellSize}
      height={CANVAS_HEIGHT * cellSize}
      className="cursor-crosshair select-none"
      style={{
        imageRendering: 'pixelated',
        width: `${CANVAS_WIDTH * cellSize}px`,
        height: `${CANVAS_HEIGHT * cellSize}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
