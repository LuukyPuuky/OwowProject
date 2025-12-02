export interface Frame {
  dur: number; // duration in ms
  arr: boolean[]; // pixel array (W * H)
}

export type BrushMode = 'paint' | 'erase';
export type BrushShape = 'circle' | 'square' | 'triangle';
export type Tool = 'brush' | 'line' | 'ellipse' | 'rect' | 'fill' | 'select';

export interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface ClipboardData {
  width: number;
  height: number;
  pixels: boolean[];
}
