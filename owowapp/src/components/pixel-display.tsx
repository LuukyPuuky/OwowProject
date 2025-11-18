"use client";

import { useEffect, useRef, useState } from "react";

export function PixelDisplay({ animation }: { animation?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: NodeJS.Timeout;

    const updateFrame = async () => {
      try {
        const params = new URLSearchParams();
        if (animation) params.append("animation", animation);

        const res = await fetch(`/api/preview?${params}`);
        const data = await res.json();

        if (data.data) {
          // Decode base64 if string
          let pixels;
          if (typeof data.data === "string") {
            const binary = atob(data.data);
            pixels = new Uint8ClampedArray(binary.length);
            for (let i = 0; i < binary.length; i++) {
              pixels[i] = binary.charCodeAt(i);
            }
          } else {
            pixels = new Uint8ClampedArray(data.data);
          }

          const imageData = new ImageData(pixels, data.width, data.height);
          ctx.putImageData(imageData, 0, 0);
        }
      } catch (err) {
        console.error("Frame fetch error:", err);
      }

      if (isPlaying) {
        animationFrameId = setTimeout(updateFrame, 1000 / 30); // 30 FPS
      }
    };

    if (isPlaying) {
      updateFrame();
    }

    return () => {
      if (animationFrameId) clearTimeout(animationFrameId);
    };
  }, [isPlaying, animation]);

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={112}
        height={16}
        className="border-2 border-gray-300 bg-black w-full max-w-lg"
        style={{ imageRendering: "pixelated" }}
      />
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isPlaying ? "Stop" : "Play"}
      </button>
    </div>
  );
}