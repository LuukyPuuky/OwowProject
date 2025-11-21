import { NextResponse } from "next/server";

export async function GET() {
  const { getAllAnimations } = await import("../../../lib/animations");
  const animations = getAllAnimations();
  return NextResponse.json(animations);
}

export const dynamic = "force-dynamic";
