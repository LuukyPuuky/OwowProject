"use client"

import React, { useEffect, useRef, useState } from 'react'
import Modal from './modal'

type PixelFrame = number[][]

interface Props {
  open: boolean
  onClose: () => void
  frames: PixelFrame[]
  width?: number
  height?: number
}

export default function AnimationPreview({ open, onClose, frames, width = 84, height = 28 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [playing, setPlaying] = useState(true)
  const [index, setIndex] = useState(0)
  const [pixelSize, setPixelSize] = useState(8)

  useEffect(() => {
    setIndex(0)
  }, [frames])

  useEffect(() => {
    let id: number | undefined
    if (playing && frames && frames.length > 0) {
      id = window.setInterval(() => {
        setIndex((i) => (i + 1) % frames.length)
      }, 150) // ~6.6fps, adjust if you want faster
    }
    return () => { if (id) window.clearInterval(id) }
  }, [playing, frames])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const px = pixelSize
    canvas.width = width * px
    canvas.height = height * px

    // clear
    ctx.fillStyle = '#0b1220'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const frame = frames && frames.length > 0 ? frames[index] : null
    if (!frame) return

    for (let y = 0; y < Math.min(height, frame.length); y++) {
      const row = frame[y] || []
      for (let x = 0; x < Math.min(width, row.length); x++) {
        const v = row[x]
        if (v) {
          ctx.fillStyle = '#fff'
          ctx.fillRect(x * px, y * px, px, px)
        } else {
          // optional darker background pixel
          ctx.fillStyle = '#071019'
          ctx.fillRect(x * px, y * px, px, px)
        }
      }
    }
  }, [index, frames, pixelSize, width, height])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preview — scaled view</h3>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={() => { setPlaying(!playing) }}>{playing ? 'Pause' : 'Play'}</button>
            <button className="btn" onClick={() => { setIndex((i) => Math.max(0, i - 1)) }}>Prev</button>
            <button className="btn" onClick={() => { setIndex((i) => (i + 1) % (frames.length || 1)) }}>Next</button>
            <button className="btn" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="border border-border bg-black p-2">
            <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', display: 'block' }} />
          </div>

          <div className="w-48">
            <div className="mb-2 text-sm">Scale: <strong>{pixelSize}×</strong></div>
            <input
              type="range"
              min={4}
              max={16}
              value={pixelSize}
              onChange={(e) => setPixelSize(Number(e.target.value))}
              className="w-full"
            />

            <div className="mt-4 text-sm">Frame {index + 1} / {frames.length}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Display is scaled for visibility — pixel data remains {width}×{height}.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
