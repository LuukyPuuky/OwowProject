// Shared types that can be used in both client and server code
// This file does NOT import canvas or any server-only dependencies

export interface DisplayConfig {
  width: number;
  height: number;
  fps: number;
}

export interface AnimationFrame {
  deltaTime: number;
  elapsedTime: number;
}

// Type for canvas context - using proper union type for canvas contexts
export type CanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D
  | null;

export type AnimationRenderer = (
  ctx: CanvasContext,
  frame: AnimationFrame,
  config: DisplayConfig
) => void;

export interface AnimationMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail?: string | boolean[]; // Can be a URL or a pixel array
  status: "Available" | "Equiped";
}
