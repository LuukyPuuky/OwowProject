import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { animationEngine } = await import("@/lib/canvas/animation-engine");

    const { animationId, customFrames } = await request.json();

    if (!animationId) {
      return NextResponse.json(
        { error: "Animation ID is required" },
        { status: 400 }
      );
    }

    // Check if this is a custom animation
    if (animationId.startsWith("custom-") && customFrames) {
      animationEngine.startCustom(customFrames);
    } else {
      animationEngine.start(animationId);
    }

    return NextResponse.json({
      success: true,
      animationId,
    });
  } catch (error) {
    console.error("Error starting animation:", error);
    return NextResponse.json(
      {
        error: "Failed to start animation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
