import { NextRequest, NextResponse } from "next/server";
import { animations } from "@/lib/animations";
import { DisplayManager } from "@/lib/display/display-manager";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const animationType = searchParams.get("animationType") || "star-bounce";

  // Get the animation renderer
  const animationKey = animationType as keyof typeof animations;
  const animation = animations[animationKey];

  if (!animation) {
    return new NextResponse("Animation not found", { status: 404 });
  }

  // Create a new DisplayManager for this stream
  // 80x20 is the standard size for now
  const width = 80;
  const height = 20;
  const fps = 30; // Lower FPS for streaming to save bandwidth/CPU
  const displayManager = new DisplayManager({ width, height, fps });
  displayManager.setRenderer(animation.renderer);

  const stream = new ReadableStream({
    async start(controller) {
      let lastTime = Date.now();
      let elapsedTime = 0;
      let intervalId: NodeJS.Timeout;

      const tick = async () => {
        try {
          const now = Date.now();
          const deltaTime = now - lastTime;
          lastTime = now;
          elapsedTime += deltaTime;

          // Render frame
          const frame = { deltaTime: deltaTime / 1000, elapsedTime };
          const buffer = await displayManager.renderRaw(frame);

          // Enqueue raw buffer
          controller.enqueue(buffer);
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
          clearInterval(intervalId);
        }
      };

      // Start the loop
      intervalId = setInterval(tick, 1000 / fps);

      // Clean up on cancel
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
    cancel() {
      // Cleanup handled in abort listener
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
    },
  });
}

export const dynamic = "force-dynamic";
