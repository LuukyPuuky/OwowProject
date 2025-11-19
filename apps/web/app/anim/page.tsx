'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './anim.module.css';
import Link from 'next/link';
import { bresenhamLine, drawEllipse, drawArrow, bitsOf, arrOf } from '@/lib/canvas-utils';
import type { Frame, BrushMode, BrushShape, AnimationState } from '@/lib/types';

type Tool = 'brush' | 'line' | 'ellipse' | 'rect' | 'fill' | 'select' | 'eyedropper' | 'spray' | 'mirror' | 'lighten' | 'darken';

const RENDERER_BASE = process.env.NEXT_PUBLIC_RENDERER_BASE || 'http://localhost:3000';
const W = 84;
const H = 28;

export default function AnimPage() {
  const [frames, setFrames] = useState<Frame[]>([{ dur: 300, arr: new Array(W * H).fill(false) }]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushMode, setBrushMode] = useState<BrushMode>('paint');
  const [brushShape, setBrushShape] = useState<BrushShape>('circle');
  const [brushSize, setBrushSize] = useState(2);
  const [duration, setDuration] = useState(300);
  const [onionEnabled, setOnionEnabled] = useState(false);
  const [onionPrev, setOnionPrev] = useState(1);
  const [onionNext, setOnionNext] = useState(0);
  const [animList, setAnimList] = useState<string[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [textConfig, setTextConfig] = useState({ enable: false, url: '', field: '', intervalMs: 30000 });
  
  // Undo/Redo
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Grid/View
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(12);
  
  // Selection
  const [selection, setSelection] = useState<number[]>([]);
  const [clipboard, setClipboard] = useState<boolean[]>([]);
  
  // Advanced features
  const [mirrorMode, setMirrorMode] = useState<'none' | 'horizontal' | 'vertical' | 'both'>('none');
  const [sprayDensity, setSprayDensity] = useState(30);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [pixelPerfect, setPixelPerfect] = useState(false);
  const [showFrameNumbers, setShowFrameNumbers] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [frameRate, setFrameRate] = useState(10);
  const [rotateAngle, setRotateAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  
  const gridRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [showCursorBadge, setShowCursorBadge] = useState(false);
  const [toast, setToast] = useState('');
  const playTimerRef = useRef<NodeJS.Timeout>();
  const isMouseDownRef = useRef(false);
  const lastMouseIndexRef = useRef(-1);
  const shapeStartIndexRef = useRef(-1);
  const shapePreviewRef = useRef<number[] | null>(null);
  const selectStartRef = useRef(-1);
  const lastAutoSaveRef = useRef<number>(Date.now());

  // Load animations list and state
  const loadAnimList = useCallback(async () => {
    try {
      const r = await fetch(`${RENDERER_BASE}/anim/list`);
      const j = await r.json();
      if (j && Array.isArray(j.items)) {
        setAnimList(j.items);
        setSelectedName(j.active || '');
        setCurrentName(j.active || '');
      }
    } catch {}
  }, []);

  const loadState = useCallback(async (name?: string) => {
    try {
      const url = name 
        ? `${RENDERER_BASE}/anim/state?name=${encodeURIComponent(name)}`
        : `${RENDERER_BASE}/anim/state`;
      const r = await fetch(url);
      const j: AnimationState = await r.json();
      
      if (j && Array.isArray(j.frames)) {
        const loadedFrames = j.frames.map(fr => ({
          dur: Number(fr.durationMs) || 300,
          arr: arrOf(String(fr.bits || ''), W * H)
        }));
        
        if (loadedFrames.length) {
          setFrames(loadedFrames);
          setIdx(Math.min(0, loadedFrames.length - 1));
          setDuration(loadedFrames[0].dur);
          // Reset history on load
          setHistory([]);
          setHistoryIndex(-1);
        }
        
        if (j.text) {
          setTextConfig({
            enable: !!j.text.enable,
            url: j.text.url || '',
            field: j.text.field || '',
            intervalMs: Math.max(1000, j.text.intervalMs || 30000)
          });
        }
        
        if (name) setCurrentName(name);
      }
    } catch {
      setFrames([{ dur: 300, arr: new Array(W * H).fill(false) }]);
      setIdx(0);
    }
  }, []);

  const saveState = useCallback(async (name?: string) => {
    const saveName = name || selectedName || currentName;
    const payload = {
      w: W,
      h: H,
      frames: frames.map(f => ({ bits: bitsOf(f.arr), durationMs: f.dur })),
      text: textConfig
    };
    
    try {
      const url = saveName 
        ? `${RENDERER_BASE}/anim/state?name=${encodeURIComponent(saveName)}`
        : `${RENDERER_BASE}/anim/state`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      // show a small toast on successful save
      setToast('Saved');
      setTimeout(() => setToast(''), 1500);
    } catch {}
  }, [frames, selectedName, currentName, textConfig]);

  // Initialize
  useEffect(() => {
    loadAnimList();
    loadState();
  }, [loadAnimList, loadState]);

  // History management
  const pushHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(frames)));
    // Keep last 50 states
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [frames, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFrames(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Spray paint
  const sprayPaint = useCallback((index: number) => {
    const arr = [...frames[idx].arr];
    const cx = index % W;
    const cy = Math.floor(index / W);
    const r = brushSize;
    const numDots = Math.floor(sprayDensity / 10);
    
    for (let i = 0; i < numDots; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist);
      const nx = cx + dx;
      const ny = cy + dy;
      
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
        arr[ny * W + nx] = (brushMode === 'paint');
      }
    }
    
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  }, [frames, idx, brushSize, brushMode, sprayDensity]);

  // Flood fill
  const floodFill = useCallback((startIndex: number) => {
    const arr = [...frames[idx].arr];
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
      
      const x = i % W;
      const y = Math.floor(i / W);
      
      // Add neighbors
      if (x > 0) queue.push(i - 1);
      if (x < W - 1) queue.push(i + 1);
      if (y > 0) queue.push(i - W);
      if (y < H - 1) queue.push(i + W);
    }
    
    pushHistory();
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  }, [frames, idx, brushMode, pushHistory]);

  // Apply brush at index
  const applyBrushAt = useCallback((index: number, skipHistory = false) => {
    const arr = [...frames[idx].arr];
    const cx = index % W;
    const cy = Math.floor(index / W);
    const r = Math.max(0, brushSize - 1);
    
    const paintPixel = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const pi = y * W + x;
      arr[pi] = (brushMode === 'paint');
    };
    
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        
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
        
        // Paint original position
        paintPixel(nx, ny);
        
        // Mirror modes
        if (mirrorMode === 'horizontal' || mirrorMode === 'both') {
          const mirrorX = W - 1 - nx;
          paintPixel(mirrorX, ny);
        }
        if (mirrorMode === 'vertical' || mirrorMode === 'both') {
          const mirrorY = H - 1 - ny;
          paintPixel(nx, mirrorY);
        }
        if (mirrorMode === 'both') {
          const mirrorX = W - 1 - nx;
          const mirrorY = H - 1 - ny;
          paintPixel(mirrorX, mirrorY);
        }
      }
    }
    
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  }, [frames, idx, brushSize, brushMode, brushShape, mirrorMode]);

  // Apply brush along line
  const applyBrushLine = useCallback((fromIndex: number, toIndex: number) => {
    const x0 = fromIndex % W;
    const y0 = Math.floor(fromIndex / W);
    const x1 = toIndex % W;
    const y1 = Math.floor(toIndex / W);
    const line = bresenhamLine(x0, y0, x1, y1);
    
    const arr = [...frames[idx].arr];
    const cx0 = fromIndex % W;
    const cy0 = Math.floor(fromIndex / W);
    const r = Math.max(0, brushSize - 1);
    
    line.forEach(cellIdx => {
      const cx = cellIdx % W;
      const cy = Math.floor(cellIdx / W);
      
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          
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
          const pi = ny * W + nx;
          arr[pi] = (brushMode === 'paint');
        }
      }
    });
    
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  }, [frames, idx, brushSize, brushMode, brushShape]);

  // Draw shape
  const drawShape = useCallback((startIndex: number, endIndex: number, toolType: Tool, commit = false) => {
    const x0 = startIndex % W;
    const y0 = Math.floor(startIndex / W);
    const x1 = endIndex % W;
    const y1 = Math.floor(endIndex / W);
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
      // Draw rectangle outline
      const minX = Math.min(x0, x1);
      const maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1);
      const maxY = Math.max(y0, y1);
      
      for (let x = minX; x <= maxX; x++) {
        points.push(minY * W + x);
        points.push(maxY * W + x);
      }
      for (let y = minY; y <= maxY; y++) {
        points.push(y * W + minX);
        points.push(y * W + maxX);
      }
    }
    
    if (commit) {
      pushHistory();
      const arr = [...frames[idx].arr];
      points.forEach(pi => {
        if (pi >= 0 && pi < arr.length) {
          arr[pi] = (brushMode === 'paint');
        }
      });
      const newFrames = [...frames];
      newFrames[idx] = { ...newFrames[idx], arr };
      setFrames(newFrames);
    }
    
    return points;
  }, [frames, idx, brushMode, pushHistory]);

  // Grid cell handlers
  const getIndexFromMouseEvent = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return -1;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cellWidth = rect.width / W;
    const cellHeight = rect.height / H;
    const gridX = Math.floor(x / cellWidth);
    const gridY = Math.floor(y / cellHeight);
    if (gridX < 0 || gridY < 0 || gridX >= W || gridY >= H) return -1;
    return gridY * W + gridX;
  }, []);

  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const index = getIndexFromMouseEvent(e);
    if (index < 0) return;
    
    isMouseDownRef.current = true;
    
    if (activeTool === 'brush') {
      pushHistory();
      applyBrushAt(index, true);
      lastMouseIndexRef.current = index;
    } else if (activeTool === 'spray') {
      pushHistory();
      sprayPaint(index);
      lastMouseIndexRef.current = index;
    } else if (activeTool === 'eyedropper') {
      const pixelValue = frames[idx].arr[index];
      setBrushMode(pixelValue ? 'paint' : 'erase');
      setActiveTool('brush');
    } else if (activeTool === 'fill') {
      floodFill(index);
    } else if (activeTool === 'select') {
      selectStartRef.current = index;
      setSelection([]);
    } else {
      shapeStartIndexRef.current = index;
      shapePreviewRef.current = null;
    }
  }, [activeTool, applyBrushAt, sprayPaint, floodFill, pushHistory, getIndexFromMouseEvent, frames, idx]);

  const handleGridMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    
    const index = getIndexFromMouseEvent(e);
    if (index < 0) return;
    
    if (activeTool === 'brush') {
      if (lastMouseIndexRef.current >= 0 && lastMouseIndexRef.current !== index) {
        applyBrushLine(lastMouseIndexRef.current, index);
      } else {
        applyBrushAt(index, true);
      }
      lastMouseIndexRef.current = index;
    } else if (activeTool === 'spray') {
      sprayPaint(index);
      lastMouseIndexRef.current = index;
    } else if (activeTool === 'select') {
      if (selectStartRef.current >= 0) {
        const x0 = selectStartRef.current % W;
        const y0 = Math.floor(selectStartRef.current / W);
        const x1 = index % W;
        const y1 = Math.floor(index / W);
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);
        
        const sel: number[] = [];
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            sel.push(y * W + x);
          }
        }
        setSelection(sel);
      }
    } else if (![ 'fill', 'eyedropper', 'spray' ].includes(String(activeTool))) {
      if (shapeStartIndexRef.current >= 0) {
        shapePreviewRef.current = drawShape(shapeStartIndexRef.current, index, activeTool as any, false);
      }
    }
  }, [activeTool, applyBrushAt, applyBrushLine, sprayPaint, drawShape, getIndexFromMouseEvent]);

  const handleGridMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    
    const index = getIndexFromMouseEvent(e);
    const nonCommittingTools = ['brush', 'fill', 'select', 'spray', 'eyedropper'];
    if (index >= 0 && !nonCommittingTools.includes(activeTool) && shapeStartIndexRef.current >= 0) {
      drawShape(shapeStartIndexRef.current, index, activeTool as any, true);
      shapePreviewRef.current = null;
      shapeStartIndexRef.current = -1;
    }
    isMouseDownRef.current = false;
    lastMouseIndexRef.current = -1;
    selectStartRef.current = -1;
  }, [activeTool, drawShape, getIndexFromMouseEvent]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isMouseDownRef.current = false;
      lastMouseIndexRef.current = -1;
      shapeStartIndexRef.current = -1;
      shapePreviewRef.current = null;
      selectStartRef.current = -1;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Frame operations
  const addFrame = () => {
    pushHistory();
    const newFrames = [...frames];
    newFrames.splice(idx + 1, 0, { dur: duration, arr: new Array(W * H).fill(false) });
    setFrames(newFrames);
    setIdx(idx + 1);
  };

  const duplicateFrame = () => {
    pushHistory();
    const newFrames = [...frames];
    newFrames.splice(idx + 1, 0, { dur: frames[idx].dur, arr: [...frames[idx].arr] });
    setFrames(newFrames);
    setIdx(idx + 1);
  };

  const deleteFrame = () => {
    if (frames.length === 1) return;
    pushHistory();
    const newFrames = frames.filter((_, i) => i !== idx);
    setFrames(newFrames);
    setIdx(Math.min(idx, newFrames.length - 1));
  };

  const clearFrame = () => {
    pushHistory();
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr: new Array(W * H).fill(false) };
    setFrames(newFrames);
    setSelection([]);
  };

  const invertFrame = () => {
    pushHistory();
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr: frames[idx].arr.map(v => !v) };
    setFrames(newFrames);
  };

  // Animation operations
  const createNewAnimation = async () => {
    const name = currentName.trim() || `anim-${Date.now()}`;
    const newFrames = [{ dur: 300, arr: new Array(W * H).fill(false) }];
    setFrames(newFrames);
    setIdx(0);
    await saveState(name);
    await fetch(`${RENDERER_BASE}/anim/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    await loadAnimList();
    await loadState(name);
  };

  const deleteAnimation = async () => {
    if (!selectedName || !confirm('Delete this animation?')) return;
    try {
      await fetch(`${RENDERER_BASE}/anim/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedName })
      });
    } catch {}
    await loadAnimList();
  };

  const setActiveAnimation = async () => {
    if (!selectedName) return;
    try {
      await fetch(`${RENDERER_BASE}/anim/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedName })
      });
    } catch {}
    await loadAnimList();
  };

  // Playback
  const play = () => {
    if (playing) return;
    setPlaying(true);
    
    const step = () => {
      setIdx(prev => {
        const next = (prev + 1) % frames.length;
        setDuration(frames[next].dur);
        playTimerRef.current = setTimeout(step, frames[next].dur);
        return next;
      });
    };
    
    playTimerRef.current = setTimeout(step, frames[idx].dur);
  };

  const stop = () => {
    setPlaying(false);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
  };

  // Advanced frame operations
  const copyFrame = () => {
    setClipboard([...frames[idx].arr]);
  };

  const pasteFrame = () => {
    if (clipboard.length === 0) return;
    pushHistory();
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr: [...clipboard] };
    setFrames(newFrames);
  };

  const rotateFrame = () => {
    pushHistory();
    const arr = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const oldIdx = y * W + x;
        const newX = H - 1 - y;
        const newY = x;
        if (newX < W && newY < H) {
          const newIdx = newY * W + newX;
          arr[newIdx] = frames[idx].arr[oldIdx];
        }
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const flipFrameH = () => {
    pushHistory();
    const arr = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const oldIdx = y * W + x;
        const newIdx = y * W + (W - 1 - x);
        arr[newIdx] = frames[idx].arr[oldIdx];
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const flipFrameV = () => {
    pushHistory();
    const arr = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const oldIdx = y * W + x;
        const newIdx = (H - 1 - y) * W + x;
        arr[newIdx] = frames[idx].arr[oldIdx];
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const shiftFrame = (dx: number, dy: number) => {
    pushHistory();
    const arr = new Array(W * H).fill(false);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const oldIdx = y * W + x;
        const newX = (x + dx + W) % W;
        const newY = (y + dy + H) % H;
        const newIdx = newY * W + newX;
        arr[newIdx] = frames[idx].arr[oldIdx];
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const addNoise = (amount: number) => {
    pushHistory();
    const arr = [...frames[idx].arr];
    const numPixels = Math.floor((W * H * amount) / 100);
    for (let i = 0; i < numPixels; i++) {
      const idx = Math.floor(Math.random() * arr.length);
      arr[idx] = Math.random() > 0.5;
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const ditherFrame = () => {
    pushHistory();
    const arr = [...frames[idx].arr];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if ((x + y) % 2 === 0) {
          arr[idx] = false;
        }
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const outlineFrame = () => {
    pushHistory();
    const oldArr = [...frames[idx].arr];
    const arr = new Array(W * H).fill(false);
    
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (!oldArr[idx]) continue;
        
        // Check if pixel is on edge
        const left = x > 0 ? oldArr[idx - 1] : false;
        const right = x < W - 1 ? oldArr[idx + 1] : false;
        const top = y > 0 ? oldArr[idx - W] : false;
        const bottom = y < H - 1 ? oldArr[idx + W] : false;
        
        if (!left || !right || !top || !bottom) {
          arr[idx] = true;
        }
      }
    }
    const newFrames = [...frames];
    newFrames[idx] = { ...newFrames[idx], arr };
    setFrames(newFrames);
  };

  const reverseFrames = () => {
    pushHistory();
    setFrames([...frames].reverse());
    setIdx(frames.length - 1 - idx);
  };

  const duplicateAllFrames = () => {
    pushHistory();
    const doubled: Frame[] = [];
    frames.forEach(f => {
      const a = { dur: f.dur, arr: [...f.arr] };
      const b = { dur: f.dur, arr: [...f.arr] };
      doubled.push(a);
      doubled.push(b);
    });
    setFrames(doubled);
  };

  // Auto-save
  useEffect(() => {
    if (!autoSave) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastAutoSaveRef.current > 30000) { // 30 seconds
        saveState();
        lastAutoSaveRef.current = now;
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoSave, saveState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      
      // Undo/Redo
      if (ctrl && key === 'z' && !shift) {
        e.preventDefault();
        undo();
      } else if (ctrl && (key === 'y' || (key === 'z' && shift))) {
        e.preventDefault();
        redo();
      }
      // Copy/Paste
      else if (ctrl && key === 'c') {
        e.preventDefault();
        copyFrame();
      } else if (ctrl && key === 'v') {
        e.preventDefault();
        pasteFrame();
      }
      // Save
      else if (ctrl && key === 's') {
        e.preventDefault();
        saveState();
      }
      // Tool shortcuts
      else if (key === 'b') {
        setActiveTool('brush');
      } else if (key === 'l') {
        setActiveTool('line');
      } else if (key === 'e') {
        setActiveTool('ellipse');
      } else if (key === 'r' && !ctrl) {
        setActiveTool('rect');
      } else if (key === 'f') {
        setActiveTool('fill');
      } else if (key === 's' && !ctrl) {
        setActiveTool('select');
      } else if (key === 'p') {
        setActiveTool('spray');
      } else if (key === 'm') {
        setActiveTool('mirror');
      }
      // Brush size
      else if (key === '[' || key === '-') {
        setBrushSize(prev => Math.max(1, prev - 1));
      } else if (key === ']' || key === '=') {
        // '=' is often the unshifted '+' on many keyboards; '+' requires shift
        setBrushSize(prev => Math.min(8, prev + 1));
      }
      // Play/Stop
      else if (key === ' ') {
        e.preventDefault();
        if (playing) stop();
        else play();
      }
      // Navigation
      else if (key === 'arrowleft' && !ctrl) {
        e.preventDefault();
        setIdx(prev => {
          const newIdx = Math.max(0, prev - 1);
          setDuration(frames[newIdx].dur);
          return newIdx;
        });
      } else if (key === 'arrowright' && !ctrl) {
        e.preventDefault();
        setIdx(prev => {
          const newIdx = Math.min(frames.length - 1, prev + 1);
          setDuration(frames[newIdx].dur);
          return newIdx;
        });
      }
      // Shift frame
      else if (ctrl && key === 'arrowleft') {
        e.preventDefault();
        shiftFrame(-1, 0);
      } else if (ctrl && key === 'arrowright') {
        e.preventDefault();
        shiftFrame(1, 0);
      } else if (ctrl && key === 'arrowup') {
        e.preventDefault();
        shiftFrame(0, -1);
      } else if (ctrl && key === 'arrowdown') {
        e.preventDefault();
        shiftFrame(0, 1);
      }
      // Flip/Rotate
      else if (ctrl && key === 'h') {
        e.preventDefault();
        flipFrameH();
      } else if (ctrl && key === 'j') {
        e.preventDefault();
        flipFrameV();
      } else if (ctrl && key === 'r') {
        e.preventDefault();
        rotateFrame();
      }
      // Clear frame
      else if (ctrl && key === 'backspace') {
        e.preventDefault();
        pushHistory();
        const newFrames = [...frames];
        newFrames[idx] = { ...newFrames[idx], arr: new Array(W * H).fill(false) };
        setFrames(newFrames);
      }
      // Invert frame
      else if (ctrl && key === 'i') {
        e.preventDefault();
        pushHistory();
        const newFrames = [...frames];
        newFrames[idx] = { ...newFrames[idx], arr: frames[idx].arr.map(v => !v) };
        setFrames(newFrames);
      }
      // Delete selection
      else if (key === 'delete' && selection.length > 0) {
        e.preventDefault();
        pushHistory();
        const arr = [...frames[idx].arr];
        selection.forEach(i => arr[i] = false);
        const newFrames = [...frames];
        newFrames[idx] = { ...newFrames[idx], arr };
        setFrames(newFrames);
        setSelection([]);
      }
      // Toggle grid
      else if (key === 'g' && !ctrl) {
        setShowGrid(prev => !prev);
      }
      // Toggle onion skin
      else if (key === 'o' && !ctrl) {
        setOnionEnabled(prev => !prev);
      }
      // Mirror modes
      else if (key === '1') {
        setMirrorMode('none');
      } else if (key === '2') {
        setMirrorMode('horizontal');
      } else if (key === '3') {
        setMirrorMode('vertical');
      } else if (key === '4') {
        setMirrorMode('both');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, frames, idx, undo, redo, saveState, selection, pushHistory, copyFrame, pasteFrame, shiftFrame, flipFrameH, flipFrameV, rotateFrame]);

  // Save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // Render grid cells
  const currentFrame = frames[idx];
  const cellSize = zoom;
  const cells = currentFrame.arr.map((isOn, i) => {
    let className = styles.cell;
    if (isOn) className += ` ${styles.on}`;
    
    // Selection
    if (selection.includes(i)) {
      className += ` ${styles.selected}`;
    }
    
    // Onion skin
    if (onionEnabled && !isOn) {
      for (let k = 1; k <= onionPrev; k++) {
        const prevFrame = frames[idx - k];
        if (prevFrame && prevFrame.arr[i]) {
          className += ` ${styles.prev}`;
          break;
        }
      }
      for (let k = 1; k <= onionNext; k++) {
        const nextFrame = frames[idx + k];
        if (nextFrame && nextFrame.arr[i]) {
          className += ` ${styles.next}`;
          break;
        }
      }
    }
    
    // Shape preview
    if (shapePreviewRef.current && shapePreviewRef.current.includes(i)) {
      className += brushMode === 'paint' ? ` ${styles.on}` : '';
    }
    
    return (
      <div
        key={i}
        className={className}
        data-idx={i}
      />
    );
  });

  return (
    <div className={styles.container}>
      {/* Menu Bar */}
      <div className={styles.menubar}>
        <h1>Animation Maker</h1>
        <Link href="/view" className={styles.toolBtn} style={{ textDecoration: 'none' }}>← Back to Viewer</Link>
        {/* HUD: quick status */}
        <div className={styles.hud} aria-hidden>
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => setActiveTool(prev => prev)}
            title={`Active tool: ${activeTool}`}
          >
            Tool: {activeTool}
          </button>
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => setBrushMode(prev => (prev === 'paint' ? 'erase' : 'paint'))}
            title="Toggle paint/erase"
          >
            Mode: {brushMode}
          </button>
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => setBrushSize(s => Math.min(8, s + 1))}
            title="Increase brush size"
          >
            Size: {brushSize}
          </button>
          <button
            type="button"
            className={styles.hudBtn}
            onClick={() => setMirrorMode(m => (m === 'none' ? 'horizontal' : m === 'horizontal' ? 'vertical' : m === 'vertical' ? 'both' : 'none'))}
            title="Cycle mirror mode"
          >
            Mirror: {mirrorMode}
          </button>
        </div>
        <div className={styles.menubarSpacer} />
        <div className={styles.menubarGroup}>
          <button className={styles.toolBtn} onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">↶</button>
          <button className={styles.toolBtn} onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">↷</button>
          <span style={{ width: '8px' }} />
          <button className={styles.toolBtn} onClick={play} title="Play (Space)">▶ Play</button>
          <button className={styles.toolBtn} onClick={stop} title="Stop (Space)">⏹ Stop</button>
          <button className={`${styles.toolBtn} ${styles.primary}`} onClick={() => saveState()} title="Save (Ctrl+S)">💾 Save</button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className={styles.workspace}>
        {/* Left Vertical Toolbar */}
        <div className={styles.leftToolbar}>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.iconBtn} ${activeTool === 'brush' ? styles.active : ''}`}
              onClick={() => setActiveTool('brush')}
              title="Brush Tool (B)"
            >
              ✏️
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'spray' ? styles.active : ''}`}
              onClick={() => setActiveTool('spray')}
              title="Spray Paint Tool (P)"
            >
              💨
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'line' ? styles.active : ''}`}
              onClick={() => setActiveTool('line')}
              title="Line Tool (L)"
            >
              📏
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'ellipse' ? styles.active : ''}`}
              onClick={() => setActiveTool('ellipse')}
              title="Ellipse Tool (E)"
            >
              ⭕
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'rect' ? styles.active : ''}`}
              onClick={() => setActiveTool('rect')}
              title="Rectangle Tool (R)"
            >
              ▭
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'fill' ? styles.active : ''}`}
              onClick={() => setActiveTool('fill')}
              title="Fill Tool (F)"
            >
              🪣
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'select' ? styles.active : ''}`}
              onClick={() => setActiveTool('select')}
              title="Select Tool (S)"
            >
              ▢
            </button>
            <button
              className={`${styles.iconBtn} ${activeTool === 'eyedropper' ? styles.active : ''}`}
              onClick={() => setActiveTool('eyedropper')}
              title="Eyedropper Tool (I)"
            >
              💧
            </button>
          </div>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.iconBtn} ${brushMode === 'paint' ? styles.active : ''}`}
              onClick={() => setBrushMode('paint')}
              title="Paint"
            >
              🎨
            </button>
            <button
              className={`${styles.iconBtn} ${brushMode === 'erase' ? styles.active : ''}`}
              onClick={() => setBrushMode('erase')}
              title="Erase"
            >
              🧹
            </button>
          </div>
          <div className={styles.toolGroup}>
            <button
              className={`${styles.iconBtn} ${mirrorMode === 'horizontal' ? styles.active : ''}`}
              onClick={() => setMirrorMode(mirrorMode === 'horizontal' ? 'none' : 'horizontal')}
              title="Mirror Horizontal (2)"
            >
              ↔️
            </button>
            <button
              className={`${styles.iconBtn} ${mirrorMode === 'vertical' ? styles.active : ''}`}
              onClick={() => setMirrorMode(mirrorMode === 'vertical' ? 'none' : 'vertical')}
              title="Mirror Vertical (3)"
            >
              ↕️
            </button>
            <button
              className={`${styles.iconBtn} ${mirrorMode === 'both' ? styles.active : ''}`}
              onClick={() => setMirrorMode(mirrorMode === 'both' ? 'none' : 'both')}
              title="Mirror Both (4)"
            >
              ✖️
            </button>
          </div>
        </div>

        {/* Left Panel */}
        <div className={styles.sidePanel}>
          <div className={styles.panelSection}>
            <h3>Animation</h3>
            <div className={styles.propRow}>
              <select
                className={styles.select}
                value={selectedName}
                onChange={(e) => {
                  setSelectedName(e.target.value);
                  loadState(e.target.value);
                  setCurrentName(e.target.value);
                }}
              >
                {animList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className={styles.propRow}>
              <input
                type="text"
                placeholder="Animation name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
              />
            </div>
            <div className={styles.btnGroup}>
              <button className={styles.toolBtn} onClick={createNewAnimation} title="Create a new empty animation">New</button>
              <button className={`${styles.toolBtn} ${styles.primary}`} onClick={setActiveAnimation} title="Set this animation as the active one used by the renderer">
                Set Active
              </button>
            </div>
            <div className={styles.btnGroup} style={{ marginTop: '4px' }}>
              <button className={styles.toolBtn} onClick={() => saveState(currentName.trim())} title="Save current animation under this name">Save As</button>
              <button className={`${styles.toolBtn} ${styles.danger}`} onClick={deleteAnimation} title="Delete selected animation (asks for confirmation)">Delete</button>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Brush</h3>
            <div className={styles.propRow}>
              <label>Size ([ ] / +/-)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button className={styles.toolBtn} onClick={() => setBrushSize(s => Math.max(1, s - 1))} title="Decrease size">-</button>
                  <button className={styles.toolBtn} onClick={() => setBrushSize(s => Math.min(8, s + 1))} title="Increase size">+</button>
                </div>
              </div>
              <span className={styles.propValue}>{brushSize}</span>
            </div>
            <div className={styles.propRow}>
              <label>Shape</label>
              <div className={styles.btnGroup}>
                <button
                  className={`${styles.toolBtn} ${brushShape === 'circle' ? styles.active : ''}`}
                  onClick={() => setBrushShape('circle')}
                >
                  ●
                </button>
                <button
                  className={`${styles.toolBtn} ${brushShape === 'square' ? styles.active : ''}`}
                  onClick={() => setBrushShape('square')}
                >
                  ■
                </button>
                <button
                  className={`${styles.toolBtn} ${brushShape === 'triangle' ? styles.active : ''}`}
                  onClick={() => setBrushShape('triangle')}
                >
                  ▲
                </button>
              </div>
            </div>
            {activeTool === 'spray' && (
              <div className={styles.propRow}>
                <label>Spray Density</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sprayDensity}
                  onChange={(e) => setSprayDensity(Number(e.target.value))}
                />
                <span className={styles.propValue}>{sprayDensity}%</span>
              </div>
            )}
          </div>

          <div className={styles.panelSection}>
            <h3>View</h3>
            <div className={styles.propRowInline}>
              <label>Grid (G)</label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
            </div>
            <div className={styles.propRow}>
              <label>Zoom</label>
              <input
                type="range"
                min="6"
                max="20"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <span className={styles.propValue}>{zoom}px</span>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Transform</h3>
            <div className={styles.btnGroup}>
              <button className={styles.toolBtn} onClick={flipFrameH} title="Flip H (Ctrl+H)">⇄</button>
              <button className={styles.toolBtn} onClick={flipFrameV} title="Flip V (Ctrl+J)">⇅</button>
              <button className={styles.toolBtn} onClick={rotateFrame} title="Rotate (Ctrl+R)">↻</button>
            </div>
            <div className={styles.btnGroup} style={{ marginTop: '4px' }}>
              <button className={styles.toolBtn} onClick={() => shiftFrame(-1, 0)} title="← (Ctrl+←)">←</button>
              <button className={styles.toolBtn} onClick={() => shiftFrame(0, -1)} title="↑ (Ctrl+↑)">↑</button>
              <button className={styles.toolBtn} onClick={() => shiftFrame(0, 1)} title="↓ (Ctrl+↓)">↓</button>
              <button className={styles.toolBtn} onClick={() => shiftFrame(1, 0)} title="→ (Ctrl+→)">→</button>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Effects</h3>
            <div className={styles.btnGroup}>
              <button className={styles.toolBtn} onClick={ditherFrame}>Dither</button>
              <button className={styles.toolBtn} onClick={outlineFrame}>Outline</button>
            </div>
            <div className={styles.btnGroup} style={{ marginTop: '4px' }}>
              <button className={styles.toolBtn} onClick={() => addNoise(10)}>Noise 10%</button>
              <button className={styles.toolBtn} onClick={() => addNoise(25)}>Noise 25%</button>
            </div>
          </div>
        </div>

        {/* Center Panel */}
        <div className={styles.centerPanel}>
          <div className={styles.canvasArea}>
            <div className={styles.gridContainer}>
              <div 
                ref={gridRef} 
                className={`${styles.grid} ${!showGrid ? styles.noGrid : ''}`}
                style={{ gridTemplateColumns: `repeat(${W}, ${cellSize}px)` }}
                onMouseDown={handleGridMouseDown}
                onMouseMove={(e) => {
                  handleGridMouseMove(e);
                  // update cursor badge position relative to viewport
                  if (gridRef.current) {
                    const rect = gridRef.current.getBoundingClientRect();
                    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    setShowCursorBadge(true);
                  }
                }}
                onMouseUp={(e) => { handleGridMouseUp(e); setShowCursorBadge(false); }}
                onMouseLeave={(e) => { handleGridMouseUp(e); setShowCursorBadge(false); setCursorPos(null); }}
              >
                {cells}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className={styles.timelineArea}>
            <div className={styles.timelineHeader}>
              <h3>Timeline</h3>
              <div className={styles.timelineControls}>
                <button className={styles.toolBtn} onClick={addFrame} title="Insert an empty frame after the current one">+ Add</button>
                <button className={styles.toolBtn} onClick={duplicateFrame} title="Duplicate the current frame">Duplicate</button>
                <button className={`${styles.toolBtn} ${styles.danger}`} onClick={deleteFrame} title="Delete the current frame">Delete</button>
                <button className={styles.toolBtn} onClick={clearFrame} title="Clear (Ctrl+Backspace)">Clear</button>
                <button className={styles.toolBtn} onClick={invertFrame} title="Invert (Ctrl+I)">Invert</button>
                <button className={styles.toolBtn} onClick={copyFrame} title="Copy (Ctrl+C)">Copy</button>
                <button className={styles.toolBtn} onClick={pasteFrame} title="Paste (Ctrl+V)" disabled={clipboard.length === 0}>Paste</button>
                <span className={styles.badge} style={{ marginLeft: '8px' }}>Frame {idx + 1}/{frames.length}</span>
              </div>
            </div>
            <div className={styles.propRow} style={{ marginTop: '8px' }}>
              <div className={styles.btnGroup}>
                <button className={styles.toolBtn} onClick={reverseFrames} title="Reverse the order of all frames (Undo: Ctrl+Z)">🔄 Reverse All</button>
                <button className={styles.toolBtn} onClick={duplicateAllFrames} title="Duplicate every frame (Undo: Ctrl+Z)">2× Double All</button>
              </div>
            </div>
            <div className={styles.timeline}>
              {frames.map((frame, i) => (
                <div
                  key={i}
                  className={`${styles.frameThumb} ${i === idx ? styles.active : ''}`}
                  style={{ '--w': W } as React.CSSProperties}
                  title={`Frame ${i + 1} • ${frame.dur}ms`}
                  onClick={() => {
                    setIdx(i);
                    setDuration(frame.dur);
                  }}
                >
                  {frame.arr.map((isOn, pi) => (
                    <div key={pi} className={`${styles.p} ${isOn ? styles.on : ''}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`${styles.sidePanel} ${styles.right}`}>
          <div className={styles.panelSection}>
            <h3>Info</h3>
            <div style={{ fontSize: '12px', lineHeight: 1.35, color: '#666', display: 'grid', gap: 6 }}>
              <div>• Black/white only. No color support.</div>
              <div>• Reverse All and Double All change the whole animation. Use Undo (Ctrl+Z) if needed.</div>
              <div>• Clear empties the current frame and clears any selection.</div>
              <div>• Save writes to the renderer; Set Active switches what’s displayed in the viewer.</div>
              <div>• Shortcuts: B brush • [ ] or +/- size • Space play/stop • Ctrl+S save • Ctrl+Backspace clear.</div>
            </div>
          </div>
          <div className={styles.panelSection}>
            <h3>Playback</h3>
            <div className={styles.propRow}>
              <label>Speed</label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
              />
              <span className={styles.propValue}>{playSpeed}x</span>
            </div>
            <div className={styles.propRowInline}>
              <label>Loop</label>
              <input
                type="checkbox"
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
              />
            </div>
            <div className={styles.propRow}>
              <label>Frame Rate</label>
              <input
                type="range"
                min="1"
                max="60"
                value={frameRate}
                onChange={(e) => setFrameRate(Number(e.target.value))}
              />
              <span className={styles.propValue}>{frameRate} FPS</span>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Frame</h3>
            <div className={styles.propRow}>
              <label>Duration (ms)</label>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={duration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDuration(val);
                  const newFrames = [...frames];
                  newFrames[idx] = { ...newFrames[idx], dur: val };
                  setFrames(newFrames);
                }}
              />
              <span className={styles.propValue}>{duration} ms</span>
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Auto-Save</h3>
            <div className={styles.propRowInline}>
              <label>Enable (30s)</label>
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
            </div>
            {autoSave && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                💾 Auto-saves every 30s
              </div>
            )}
          </div>

          <div className={styles.panelSection}>
            <h3>Onion Skin</h3>
            <div className={styles.propRowInline}>
              <label>Enable (O)</label>
              <input
                type="checkbox"
                checked={onionEnabled}
                onChange={(e) => setOnionEnabled(e.target.checked)}
              />
            </div>
            <div className={styles.propRow}>
              <label>Previous Frames</label>
              <input
                type="number"
                min="0"
                max="2"
                value={onionPrev}
                onChange={(e) => setOnionPrev(Number(e.target.value))}
              />
            </div>
            <div className={styles.propRow}>
              <label>Next Frames</label>
              <input
                type="number"
                min="0"
                max="2"
                value={onionNext}
                onChange={(e) => setOnionNext(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.panelSection}>
            <h3>Text Overlay</h3>
            <div className={styles.propRowInline}>
              <label>Enable</label>
              <input
                type="checkbox"
                checked={textConfig.enable}
                onChange={(e) => setTextConfig({ ...textConfig, enable: e.target.checked })}
              />
            </div>
            <div className={styles.propRow}>
              <label>API URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={textConfig.url}
                onChange={(e) => setTextConfig({ ...textConfig, url: e.target.value })}
              />
            </div>
            <div className={styles.propRow}>
              <label>JSON Field</label>
              <input
                type="text"
                placeholder="message"
                value={textConfig.field}
                onChange={(e) => setTextConfig({ ...textConfig, field: e.target.value })}
              />
            </div>
            <div className={styles.propRow}>
              <label>Interval (ms)</label>
              <input
                type="number"
                min="1000"
                step="500"
                value={textConfig.intervalMs}
                onChange={(e) => setTextConfig({ ...textConfig, intervalMs: Number(e.target.value) })}
              />
            </div>
            <button
              className={`${styles.toolBtn} ${styles.primary}`}
              style={{ width: '100%', marginTop: '4px' }}
              onClick={() => saveState()}
              title="Save the text overlay configuration"
            >
              Save Config
            </button>
          </div>
        </div>
      </div>
      {/* Cursor badge */}
      {showCursorBadge && cursorPos && (
        <div
          className={styles.cursorBadge}
          style={{ left: cursorPos.x + 30, top: cursorPos.y + 80 }}
        >
          {brushMode === 'paint' ? '●' : '○'} {brushSize}px
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={styles.toast} role="status">{toast}</div>
      )}
    </div>
  );
}
