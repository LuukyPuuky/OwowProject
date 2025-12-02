import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET() {
  try {
    const uploadDir = join(process.cwd(), "public", "gifs");

    if (!existsSync(uploadDir)) {
      return NextResponse.json({ gifs: [] });
    }

    const files = await readdir(uploadDir);

    // Filter for image/gif files only
    const imageFiles = files.filter((file) =>
      /\.(gif|jpg|jpeg|png|webp)$/i.test(file)
    );

    return NextResponse.json({
      gifs: imageFiles,
    });
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
