"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PixelDisplayProps {
  size?: "small" | "large";
  autoRefresh?: boolean;
  animationType?: string;
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
  animationType = "1",
}: PixelDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scale = size === "large" ? 4 : 2;
  const width = 80;
  const height = 20;

  useEffect(() => {
    if (!autoRefresh) return;

    const controller = new AbortController();
    let isMounted = true;

    const startStream = async () => {
      try {
        setIsLoading(true);
        const safeAnimationType = animationType || "star-bounce";
        const response = await fetch(
          `/api/stream?animationType=${safeAnimationType}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.body) return;

        const reader = response.body.getReader();
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
    };
  }, [autoRefresh, animationType]);

  return (
    <div
      className="flex items-center justify-center bg-black rounded-lg overflow-hidden"
      style={{ width: width * scale, height: height * scale }}
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
          width: width * scale,
          height: height * scale,
          imageRendering: "pixelated",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
}
