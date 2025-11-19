import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import * as Animations from "@/lib/animations";

const DISPLAY_WIDTH = 112;
const DISPLAY_HEIGHT = 16;
const animationStates = new Map<string, { frameIndex: number }>();

export async function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("animation") || "star-bounce") as string;

  try {
    if (!animationStates.has(name)) animationStates.set(name, { frameIndex: 0 });
    const state = animationStates.get(name)!;

    // Get animation function from exports
    const animationFn = (Animations as any)[name];
    if (!animationFn || typeof animationFn !== "function") {
      return NextResponse.json({ error: `Animation "${name}" not found` }, { status: 404 });
    }

    const canvas = createCanvas(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    const ctx = canvas.getContext("2d") 
    if (!ctx) throw new Error("Failed to get canvas context");

    // Clear background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // Call animation renderer
    animationFn(ctx, state.frameIndex, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // Advance frame
    state.frameIndex = (state.frameIndex + 1) % 1000;

    // Convert canvas to PNG base64
    const buffer = canvas.toBuffer("image/png");
    return NextResponse.json({
      type: "frame",
      data: buffer.toString("base64"),
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
      animation: name,
    });
  } catch (err: any) {
    console.error("Preview error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}