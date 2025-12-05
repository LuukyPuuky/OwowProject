import { NextRequest, NextResponse } from "next/server";
import { animations } from "@/lib/animations";
import { DisplayManager } from "@/lib/display/display-manager";
import { PREVIEW_WIDTH, PREVIEW_HEIGHT, FPS } from "@/lib/display/settings";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const animationType = searchParams.get("animationType") || "logo";

  // Get the animation renderer
  const animationKey = animationType as keyof typeof animations;
  const animation = animations[animationKey];

  if (!animation) {
    return new NextResponse("Animation not found", { status: 404 });
  }

  // Create a new DisplayManager for this stream
  // Use preview dimensions for UI display (80x20)
  const width = PREVIEW_WIDTH;
  const height = PREVIEW_HEIGHT;
  const fps = FPS;
  const displayManager = new DisplayManager({ width, height, fps });
  displayManager.setRenderer(animation.renderer);

  const stream = new ReadableStream({
    async start(controller) {
      let lastTime = Date.now();
      let elapsedTime = 0;

      const tick = async (id: NodeJS.Timeout) => {
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
          clearInterval(id);
        }
      };

      // Start the loop
      const intervalId = setInterval(() => tick(intervalId), 1000 / fps);

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
