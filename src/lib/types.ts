export interface Frame {
  dur: number; // duration in ms
  arr: boolean[]; // pixel array (W * H)
}

export type BrushMode = 'paint' | 'erase';
export type BrushShape = 'circle' | 'square' | 'triangle';
export type Tool = 'brush' | 'line' | 'ellipse' | 'rect' | 'fill' | 'select';
