import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "gifs");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploaded = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const extension = file.name.split(".").pop()?.toLowerCase();
      const filename = `${timestamp}-${sanitizedName}`;
      const filepath = join(uploadDir, filename);

      try {
        // Process image to black and white
        if (extension === "gif") {
          // For GIFs, we need to handle animated frames
          // Sharp doesn't fully support animated GIF editing, so we'll process static GIFs
          // For animated GIFs, consider using gifsicle or other tools
          await sharp(buffer, { animated: true })
            .grayscale() // Convert to black and white
            .toFile(filepath);
        } else {
          // For static images (PNG, JPG, etc.)
          await sharp(buffer)
            .grayscale() // Convert to black and white
            .toFile(filepath);
        }

        uploaded.push({
          name: filename,
          originalName: file.name,
          size: file.size,
          url: `/gifs/${filename}`,
        });
      } catch (sharpError) {
        console.error("Sharp processing error:", sharpError);
        // Fallback: save original file if processing fails
        await writeFile(filepath, buffer);
        uploaded.push({
          name: filename,
          originalName: file.name,
          size: file.size,
          url: `/gifs/${filename}`,
          warning: "Uploaded as original (B&W conversion failed)",
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
