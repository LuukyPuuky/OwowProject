import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import { starBounce, textScroll, wave, timer, logo } from "@/lib/animations";

const DISPLAY_WIDTH = 112;
const DISPLAY_HEIGHT = 16;

const animationStates = new Map<string, { frameIndex: number }>();

export async function GET(request: NextRequest) {
  const animationName = request.nextUrl.searchParams.get("animation") || "star-bounce";

  try {
    if (!animationStates.has(animationName)) {
      animationStates.set(animationName, { frameIndex: 0 });
    }

    const state = animationStates.get(animationName)!;

    const canvas = createCanvas(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    const animationRenderer = getAnimationRenderer(animationName);
    if (!animationRenderer) {
      throw new Error(`Animation "${animationName}" not found`);
    }

    animationRenderer(ctx, state.frameIndex, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    state.frameIndex = (state.frameIndex + 1) % 1000;

    const buffer = canvas.toBuffer("image/png");
    const base64 = buffer.toString("base64");

    return NextResponse.json({
      type: "frame",
      data: base64,
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
      animation: animationName,
    });
  } catch (err: any) {
    console.error("Preview error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

function getAnimationRenderer(
  name: string
): ((ctx: CanvasRenderingContext2D, frame: number, width: number, height: number) => void) | null {
  const animationMap: Record<
    string,
    (ctx: CanvasRenderingContext2D, frame: number, width: number, height: number) => void
  > = {
    "star-bounce": starBounce,
    "text-scroll": textScroll,
    wave,
    timer,
    logo,
  };

  return animationMap[name] || null;
}s