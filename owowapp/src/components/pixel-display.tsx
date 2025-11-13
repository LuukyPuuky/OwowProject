"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface PixelDisplayProps {
  size?: "small" | "large";
  autoRefresh?: boolean;
  animationType?: string;
}

export function PixelDisplay({
  size = "small",
  autoRefresh = true,
  animationType = "1",
}: PixelDisplayProps) {
  const [frameUrl, setFrameUrl] = useState<string>("/placeholder.svg");
  const [isLoading, setIsLoading] = useState(true);
  const frameRef = useRef<number | null>(null);

  const scale = size === "large" ? 4 : 2;

  useEffect(() => {
    if (!autoRefresh) return;

    const updateFrame = () => {
      const url = `/api/preview?t=${Date.now()}`;
      setFrameUrl(url);
      // Set loading false after a short delay to prevent infinite loading
      setTimeout(() => setIsLoading(false), 100);
      frameRef.current = requestAnimationFrame(updateFrame);
    };

    // Initial load
    setTimeout(() => setIsLoading(false), 500);
    frameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [autoRefresh]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: 80 * scale, height: 20 * scale }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      ) : (
        <Image
          width={80 * scale}
          height={20 * scale}
          src={frameUrl}
          alt="Pixel display"
          style={{
            width: 80 * scale,
            height: 20 * scale,
            imageRendering: "pixelated",
          }}
          className="object-contain"
          unoptimized={frameUrl.startsWith("/api/preview")}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}
