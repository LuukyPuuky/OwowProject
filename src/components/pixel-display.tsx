"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PixelDisplayProps {
  size?: "small" | "large" | "mini";
  autoRefresh?: boolean;
  animationType?: string;
  customFrames?: Array<{ dur: number; arr: boolean[] }>;
  staticFrame?: boolean[];
  renderer?: (
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => void;
}

export function PixelDisplay({
  size = "small",
  autoRefresh = true,
  animationType,
  customFrames,
  staticFrame,
}: PixelDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const sizeMap = {
    small: 2,
    large: 6,
    mini: 1,
  };
  const scale = sizeMap[size];
  const width = 80;
  const height = 20;

  useEffect(() => {
    // Handle static frame (thumbnail)
    if (staticFrame && staticFrame.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Convert boolean array to RGBA
      for (let i = 0; i < staticFrame.length && i < width * height; i++) {
        const pixelValue = staticFrame[i] ? 255 : 0;
        const index = i * 4;
        data[index] = pixelValue;     // R
        data[index + 1] = pixelValue; // G
        data[index + 2] = pixelValue; // B
        data[index + 3] = 255;        // A
      }

      ctx.putImageData(imageData, 0, 0);
      setIsLoading(false);
      return;
    }

    // Handle custom frames locally (no streaming)
    if (customFrames && customFrames.length > 0) {
      setIsLoading(false);
      let currentFrame = 0;
      let animationInterval: NodeJS.Timeout | null = null;
      let isMounted = true;

      const renderFrame = () => {
        if (!isMounted) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const frame = customFrames[currentFrame];
        if (!frame) return;
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        // Convert boolean array to RGBA
        for (let i = 0; i < frame.arr.length && i < width * height; i++) {
          const pixelValue = frame.arr[i] ? 255 : 0;
          const index = i * 4;
          data[index] = pixelValue;     // R
          data[index + 1] = pixelValue; // G
          data[index + 2] = pixelValue; // B
          data[index + 3] = 255;        // A
        }

        ctx.putImageData(imageData, 0, 0);

        // Schedule next frame
        currentFrame = (currentFrame + 1) % customFrames.length;
        const nextFrameDuration = customFrames[currentFrame]?.dur ?? frame.dur;
        if (isMounted) {
          animationInterval = setTimeout(renderFrame, nextFrameDuration);
        }
      };

      // Render first frame immediately, then schedule the rest
      renderFrame();

      return () => {
        isMounted = false;
        if (animationInterval) {
          clearTimeout(animationInterval);
        }
      };
    }

    // If no animation type and autoRefresh is off, or no content to show
    if (!autoRefresh || !animationType) {
      // Clear canvas if no animation
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
      setIsLoading(false);
      return;
    }

    // Handle streaming animations (only if we have animationType)

    const controller = new AbortController();
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const startStream = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/stream?animationType=${animationType}`,
          {
            signal: controller.signal,
          }
        ).catch((error) => {
          // Silently handle network errors - likely no backend running
          console.warn("Stream API not available:", error.message);
          return null;
        });

        if (!response) {
          setIsLoading(false);
          // Clear canvas on error
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx) {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);
          }
          return;
        }

        if (!response.body) {
          setIsLoading(false);
          return;
        }

        reader = response.body.getReader();
        const canvas = canvasRef.current;
        if (!canvas) {
          setIsLoading(false);
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        // Disable smoothing for pixel art look
        ctx.imageSmoothingEnabled = false;

        setIsLoading(false);

        const frameSize = width * height;
        let bufferAccumulator = new Uint8Array(0);

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done || !isMounted) break;

          // Append new data to accumulator
          const newBuffer = new Uint8Array(
            bufferAccumulator.length + value.length
          );
          newBuffer.set(bufferAccumulator);
          newBuffer.set(value, bufferAccumulator.length);
          bufferAccumulator = newBuffer;

          // Process complete frames
          while (bufferAccumulator.length >= frameSize) {
            const frameData = bufferAccumulator.slice(0, frameSize);
            bufferAccumulator = bufferAccumulator.slice(frameSize);

            // Draw frame
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            for (let i = 0; i < frameSize; i++) {
              const pixelValue = frameData[i];
              const index = i * 4;
              data[index] = pixelValue; // R
              data[index + 1] = pixelValue; // G
              data[index + 2] = pixelValue; // B
              data[index + 3] = 255; // Alpha
            }

            ctx.putImageData(imageData, 0, 0);
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.warn("Stream error (backend may not be running):", error);
        }
        setIsLoading(false);
        // Clear canvas on error
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (canvas && ctx) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      controller.abort();
      // Force cancel the reader stream immediately
      if (reader) {
        reader.cancel().catch(() => {
          // Ignore errors on cancel
        });
      }
    };
  }, [autoRefresh, animationType, customFrames, staticFrame]);

  return (
    <div
      className="flex items-center justify-center bg-black rounded-lg overflow-hidden"
      style={{
        width: "100%",
        maxWidth: width * scale,
        aspectRatio: `${width}/${height}`,
      }}
    >
      {isLoading && (
        <div className="absolute flex flex-col items-center justify-center gap-2 text-muted-foreground z-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
}
