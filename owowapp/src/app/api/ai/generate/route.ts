import { NextResponse } from "next/server"

type PixelFrame = number[][]

function hashString(s: string) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function seededRandom(seed: number) {
  return function () {
    // Xorshift32-like
    seed ^= seed << 13
    seed ^= seed >>> 17
    seed ^= seed << 5
    seed = seed >>> 0
    return (seed % 1000000) / 1000000
  }
}

function generateFramesFromPrompt(prompt: string, w = 84, h = 28, frames = 12): PixelFrame[] {
  const seed = hashString(prompt || 'owow')
  const rnd = seededRandom(seed)
  const out: PixelFrame[] = []

  // create a moving wave + dot pattern influenced by prompt hash
  for (let f = 0; f < frames; f++) {
    const frame: PixelFrame = []
    const phase = (f / frames) * Math.PI * 2
    for (let y = 0; y < h; y++) {
      const row: number[] = []
      for (let x = 0; x < w; x++) {
        // wave based on y and x
        const nx = (x / w) * 4 + rnd() * 0.6
        const ny = (y / h) * 4 + rnd() * 0.6
        const value = Math.sin(nx * 2 + phase) + Math.cos(ny * 1.5 - phase * 0.5)
        // small moving blobs
        const blob = Math.sin((x + f * 3 + rnd() * 10) * 0.12) + Math.cos((y - f * 2) * 0.15)
        const threshold = 0.3 + (rnd() - 0.5) * 0.4
        const v = value + blob
        row.push(v > threshold ? 1 : 0)
      }
      frame.push(row)
    }
    out.push(frame)
  }

  return out
}

async function callGemini(promptText: string, width: number, height: number, frames: number) {
  // The route tries to use a Gemini-compatible endpoint if configured via env vars.
  // Set these in your environment to enable Gemini:
  // GEMINI_ENDPOINT - full URL to POST the generation request to
  // GEMINI_API_KEY - Bearer API key

  const endpoint = process.env.GEMINI_ENDPOINT
  const key = process.env.GEMINI_API_KEY
  if (!endpoint || !key) return null

  // Craft a strict instruction so the model returns pure JSON with the required shape.
  const instruction = `You are a generator that outputs only valid JSON. Produce a JSON object with a single property \"frames\" which is an array of ${frames} frames. Each frame must be an array of ${height} rows, each row an array of ${width} integers (0 or 1). 1 means pixel on, 0 means pixel off. No extra keys, no commentary, no markdown. The animation must match this description: ${promptText}`

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ prompt: instruction }),
    })

    const text = await resp.text()
    if (!text) return null

    // Try to parse JSON directly; if that fails, attempt to extract a JSON substring.
    try {
      const parsed = JSON.parse(text)
      if (parsed && parsed.frames) return parsed.frames
    } catch (e) {
      // attempt to extract JSON object between first { and last }
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start !== -1 && end !== -1 && end > start) {
        const sub = text.slice(start, end + 1)
        try {
          const parsed = JSON.parse(sub)
          if (parsed && parsed.frames) return parsed.frames
        } catch (e2) {
          // fallthrough
        }
      }
    }

    return null
  } catch (err) {
    return null
  }
}

// --- Semantic local generator -------------------------------------------------
function getSpriteForObject(name: string): number[][] | null {
  // sprites are small 0/1 matrices (rows)
  const sprites: Record<string, number[][]> = {
    face: [
      [0,1,1,1,0],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
    ],
    tree: [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,1,1,1,1],
    ],
    heart: [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,0,0],
    ],
    star: [
      [0,1,0],
      [1,1,1],
      [0,1,0],
    ],
    dot: [[1]],
    box: [
      [1,1,1,1],
      [1,0,0,1],
      [1,0,0,1],
      [1,1,1,1],
    ],
  }
  return sprites[name] ?? null
}

function drawSpriteOnto(frame: PixelFrame, sprite: number[][], offsetX: number, offsetY: number) {
  const h = frame.length
  const w = frame[0].length
  for (let sy = 0; sy < sprite.length; sy++) {
    const y = offsetY + sy
    if (y < 0 || y >= h) continue
    for (let sx = 0; sx < sprite[0].length; sx++) {
      const x = offsetX + sx
      if (x < 0 || x >= w) continue
      if (sprite[sy][sx]) frame[y][x] = 1
    }
  }
}

function parsePrompt(prompt: string) {
  const p = (prompt || '').toLowerCase()

  // object detection with some synonyms and word-boundary matching
  const objects = {
    tree: ['tree', 'plant'],
    heart: ['heart', 'love'],
    star: ['star'],
    dot: ['dot', 'pixel'],
    box: ['box', 'square'],
    face: ['face', 'smile', 'smiley', 'smiley face', 'eyes', 'eye', 'mouth', ':)', ':(', ':-)']
  }

  let foundObj: string | null = null
  for (const key of Object.keys(objects)) {
    for (const token of (objects as any)[key]) {
      // escape regex metacharacters
      const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // use word boundaries only for word-like tokens; emoticons/punctuation shouldn't use \b
      const useBoundary = /^[A-Za-z0-9_]+$/.test(token)
      const pattern = useBoundary ? '\\b' + escaped + '\\b' : escaped
      const re = new RegExp(pattern)
      if (re.test(p)) { foundObj = key; break }
    }
    if (foundObj) break
  }

  // fallback: if emoticon present and no object detected, assume face
  if (!foundObj && /[:;=8][\)\(DPp]/.test(p)) foundObj = 'face'

  // motion detection
  let motion: 'left-right'|'right-left'|'bounce'|'around'|'random'|'none' = 'none'
  const motionMap: Record<string,string[]> = {
    'left-right': ['left to right', 'left-to-right', 'move left', 'moving right'],
    'right-left': ['right to left', 'right-to-left', 'move right', 'moving left'],
    'bounce': ['bounce', 'bouncing', 'bouncy'],
    'around': ['around', 'circle', 'orbit', 'moving around', 'spin', 'rotate'],
    'random': ['move', 'moving', 'wander', 'random', 'float']
  }
  for (const [m, tokens] of Object.entries(motionMap)) {
    for (const token of tokens) {
      if (p.includes(token)) { motion = m as any; break }
    }
    if (motion !== 'none') break
  }

  return { object: foundObj, motion }
}

function semanticGenerate(prompt: string, width = 84, height = 28, frames = 12): PixelFrame[] | null {
  const parsed = parsePrompt(prompt)
  if (!parsed.object) return null
  const sprite = getSpriteForObject(parsed.object)
  if (!sprite) return null

  const spriteH = sprite.length
  const spriteW = sprite[0].length

  const out: PixelFrame[] = []
  // compute path based on motion
  const centerX = Math.floor((width - spriteW) / 2)
  const centerY = Math.max(0, Math.floor((height - spriteH) / 2))

  // seeded random for deterministic 'random' motion
  const rnd = seededRandom(hashString(prompt || 'semantic'))
  // phase offset so similar prompts don't perfectly align
  const phase = (hashString(prompt || '') % 1000) / 1000 * Math.PI * 2

  for (let f = 0; f < frames; f++) {
    const t = frames === 1 ? 1 : f / (frames - 1)
    let curX = centerX
    let curY = centerY

    if (parsed.motion === 'left-right') {
      const startX = -spriteW
      const endX = width
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t)
      // fractional position then round to avoid quantization stalls
      curX = Math.round(startX + (endX - startX) * ease + Math.sin(phase + t * 2) * 0.5)
    } else if (parsed.motion === 'right-left') {
      const startX = width
      const endX = -spriteW
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t)
      curX = Math.round(startX + (endX - startX) * ease + Math.cos(phase + t * 2) * 0.5)
    } else if (parsed.motion === 'bounce') {
      const radius = 12
      const ease = 0.5 - 0.5 * Math.cos(Math.PI * t)
      curX = Math.round(centerX - radius + (radius * 2) * ease + Math.sin(phase + t * 3) * 0.6)
    } else if (parsed.motion === 'around') {
      // circular motion around center
      const radiusX = Math.min(12, Math.floor((width - spriteW) / 4))
      const radiusY = Math.min(6, Math.floor((height - spriteH) / 4))
      const angle = phase + t * Math.PI * 2
      curX = Math.round(centerX + radiusX * Math.cos(angle))
      curY = Math.round(centerY + radiusY * Math.sin(angle))
    } else if (parsed.motion === 'random') {
      // small deterministic random walk
      const maxOffsetX = Math.floor((width - spriteW) / 2)
      const maxOffsetY = Math.floor((height - spriteH) / 2)
      // use rnd for deterministic but varied offsets per frame
      const ox = Math.round((rnd() - 0.5) * maxOffsetX * 2)
      const oy = Math.round((rnd() - 0.5) * maxOffsetY * 2)
      curX = centerX + ox
      curY = centerY + oy
    }

    const frame: PixelFrame = Array.from({ length: height }, () => Array.from({ length: width }, () => 0))
    drawSpriteOnto(frame, sprite, curX, curY)
    out.push(frame)
  }

  return out
}


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = body?.prompt || ''
    const debug = Boolean(body?.debug || (req.headers && (req.headers as any).get && (req.headers as any).get('x-debug') === '1'))
    const width = Number(body?.width) || 84
    const height = Number(body?.height) || 28
    const frames = Number(body?.frames) || 12

    // Attempt Gemini first (if configured). If it fails or returns invalid data,
    // fall back to the deterministic generator so the API always responds.
  const geminiResult = await callGemini(prompt, width, height, frames)
    if (geminiResult && Array.isArray(geminiResult) && geminiResult.length === frames) {
      // Validate and coerce values to 0/1 integers and correct shape
      const validated = geminiResult.map((frame: any) => {
        const f: PixelFrame = []
        for (let y = 0; y < height; y++) {
          const rowSrc = Array.isArray(frame[y]) ? frame[y] : (frame[y] || [])
          const row: number[] = []
          for (let x = 0; x < width; x++) {
            const v = rowSrc[x]
            const n = v === 1 || v === '1' || v === true ? 1 : 0
            row.push(n)
          }
          f.push(row)
        }
        return f
      })

      // Quick heuristics to ensure the returned frames are meaningful and show motion.
      function averageOnPixels(framesArr: PixelFrame[]) {
        const perFrameCounts = framesArr.map((fr) => fr.reduce((s, r) => s + r.reduce((a, b) => a + (b ? 1 : 0), 0), 0))
        const avg = perFrameCounts.reduce((a, b) => a + b, 0) / perFrameCounts.length
        const diffs = perFrameCounts.map((c, i, arr) => {
          if (i === 0) return 0
          return Math.abs(c - arr[i - 1])
        })
        const avgDiff = diffs.reduce((a, b) => a + b, 0) / (diffs.length || 1)
        return { avg, avgDiff }
      }

      const stats = averageOnPixels(validated)
      const MIN_AVG_ON = 2 // at least a few pixels on per frame
      const MIN_AVG_DIFF = 1 // some difference frame-to-frame

      if (stats.avg < MIN_AVG_ON || stats.avgDiff < MIN_AVG_DIFF) {
        // Reject Gemini output as probably empty or motionless — fall back to deterministic generator
        console.warn('[ai/generate] Gemini output rejected by heuristics (avgOn=', stats.avg, 'avgDiff=', stats.avgDiff, ')')
      } else {
  if (debug) return NextResponse.json({ frames: validated, _meta: { source: 'gemini', stats, receivedPrompt: prompt } })
  return NextResponse.json({ frames: validated })
      }
    }

    // If Gemini failed or was rejected, try semantic local generator (object+motion parser)
    const semantic = semanticGenerate(prompt, width, height, frames)
    if (semantic && Array.isArray(semantic)) {
      // verify semantic result isn't empty
      const onCount = semantic.reduce((s, fr) => s + fr.reduce((sr, r) => sr + r.reduce((a,b) => a + (b?1:0),0),0), 0)
      if (onCount > 0) {
  if (debug) return NextResponse.json({ frames: semantic, _meta: { source: 'semantic', onCount, receivedPrompt: prompt } })
  return NextResponse.json({ frames: semantic })
      }
    }

    // Fallback deterministic generator
    const generated = generateFramesFromPrompt(prompt, width, height, frames)
  if (debug) return NextResponse.json({ frames: generated, _meta: { source: 'fallback', seed: (prompt || 'owow'), receivedPrompt: prompt } })
  return NextResponse.json({ frames: generated })
  } catch (err: any) {
    return new NextResponse(String(err?.message || err), { status: 500 })
  }
}
