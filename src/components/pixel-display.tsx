"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PixelDisplayProps {
  size?: "small" | "large" | "mini";
  autoRefresh?: boolean;
  animationType?: string;
  customFrames?: Array<{ dur: number; arr: boolean[] }>;
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
    if (!autoRefresh) {
      // Clear canvas if no animation
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
      return;
    }

    // Handle custom frames locally (no streaming)
    if (customFrames && customFrames.length > 0) {
      let currentFrame = 0;
      let animationInterval: NodeJS.Timeout;
      let isMounted = true;

      const renderFrame = () => {
        if (!isMounted) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const frame = customFrames[currentFrame];
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
        animationInterval = setTimeout(renderFrame, frame.dur);
      };

      renderFrame();

      return () => {
        isMounted = false;
        if (animationInterval) {
          clearTimeout(animationInterval);
        }
      };
    }

    // Handle streaming animations
    if (!animationType) {
      // Clear canvas if no animation
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }
      return;
    }

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
        );

        if (!response.body) return;

        reader = response.body.getReader();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Disable smoothing for pixel art look
        ctx.imageSmoothingEnabled = false;

        setIsLoading(false);

        const frameSize = width * height;
        let bufferAccumulator = new Uint8Array(0);

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;

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
          console.error("Stream error:", error);
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
  }, [autoRefresh, animationType, customFrames]);

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
