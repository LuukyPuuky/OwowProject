export interface Frame {
  dur: number; // duration in ms
  arr: boolean[]; // pixel array (W * H)
}

export interface TextConfig {
  enable: boolean;
  url: string;
  field: string;
  intervalMs: number;
}

export interface AnimationState {
  name: string;
  w: number;
  h: number;
  frames: Array<{ bits: string; durationMs: number }>;
  text: TextConfig;
}

export type BrushMode = 'paint' | 'erase';
export type BrushShape = 'circle' | 'square' | 'triangle';
