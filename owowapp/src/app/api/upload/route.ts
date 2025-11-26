// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'gifs')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploaded = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate filename with timestamp to avoid conflicts
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${sanitizedName}`
      const filepath = join(uploadDir, filename)

      // Write file
      await writeFile(filepath, buffer)
      
      uploaded.push({
        name: filename,
        originalName: file.name,
        size: file.size,
        url: `/gifs/${filename}`
      })
    }

    return NextResponse.json({
      success: true,
      uploaded
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

