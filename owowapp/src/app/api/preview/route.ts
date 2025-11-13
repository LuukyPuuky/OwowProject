import { NextResponse } from "next/server";

export async function GET() {
  const { animationEngine } = await import("@/lib/animation-engine");

  const frame = animationEngine.getLatestFrame();

  if (!frame) {
    return new NextResponse("No frame available", { status: 404 });
  }

  return new NextResponse(Uint8Array.from(frame), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

export const dynamic = "force-dynamic";
