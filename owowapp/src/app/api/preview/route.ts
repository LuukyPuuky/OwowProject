import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { animations } from "@/lib/animations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const animationType = searchParams.get("animationType") || "star-bounce";
    const timestamp = searchParams.get("t") || Date.now().toString();

    // Get the animation renderer
    const animationKey = animationType as keyof typeof animations;
    const animation = animations[animationKey];

    if (!animation) {
      return new NextResponse("Animation not found", { status: 404 });
    }

    // Create server-side canvas
    const width = 84;
    const height = 28;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Render the animation with current timestamp
    const elapsedTime = Number(timestamp) % 10000; // Loop every 10 seconds
    const deltaTime = 0; // deltaTime is required by AnimationFrame; preview uses a fixed value
    const frame = { deltaTime, elapsedTime }; // Remove frameNumber - animations expect deltaTime and elapsedTime
    const config = { width, height, fps: 60 };

    animation.renderer(ctx, frame, config);

    // Convert canvas to buffer and convert to Uint8Array for NextResponse
    const buffer = canvas.toBuffer("image/png");
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Preview API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export const dynamic = "force-dynamic";
