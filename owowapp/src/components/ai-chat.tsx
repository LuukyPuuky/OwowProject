"use client"
import React, { useState } from 'react'

type PixelFrame = number[][]

export default function AIChat({ onGenerate }:{ onGenerate?: (frames: {id:number,pixels:PixelFrame}[]) => void }){
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<{role:'user'|'assistant', text:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [debug, setDebug] = useState(false)

  const send = async () => {
    if (!prompt.trim()) return
    const user = prompt.trim()
    setMessages((m) => [...m, { role: 'user', text: user }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: user, width: 84, height: 28, frames: 12, debug }),
      })

      if (!res.ok) {
        const text = await res.text()
        setMessages((m) => [...m, { role: 'assistant', text: `Error: ${text}` }])
        return
      }

      const data = await res.json()
      // expected shape: { frames: number[][][] }
      const generated = data.frames || []
      setMessages((m) => [...m, { role: 'assistant', text: `Generated ${generated.length} frames.` }])

      // show debug metadata if returned
      if (data._meta) {
        try {
          const metaText = `Source: ${data._meta.source} ${data._meta.receivedPrompt ? `| prompt: "${String(data._meta.receivedPrompt).slice(0,120)}"` : ''}`
          setMessages((m) => [...m, { role: 'assistant', text: metaText }])
        } catch (e) {
          setMessages((m) => [...m, { role: 'assistant', text: `Meta: ${JSON.stringify(data._meta)}` }])
        }
      }

      if (onGenerate) {
        const mapped = generated.map((pixels: number[][], i: number) => ({ id: i+1, pixels }))
        onGenerate(mapped)
      }

    } catch (err: any) {
      setMessages((m) => [...m, { role: 'assistant', text: `Error: ${err?.message || String(err)}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 bg-card border border-border rounded-md text-muted-foreground">
      <h3 className="text-sm font-semibold mb-2">AI Animator</h3>

      <div className="mb-2">
        <textarea
          className="w-full p-2 rounded bg-background text-foreground border border-border text-sm"
          rows={3}
          placeholder="Describe the animation you want (e.g. 'a bouncing heart, high contrast, simple shapes')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mb-3">
        <button
          className="btn btn-primary flex-1"
          onClick={send}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate 84×28 · 12 frames'}
        </button>
        <button
          className="btn"
          onClick={() => setPrompt('')}
          disabled={loading}
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          <span>Return debug metadata</span>
        </label>
      </div>

      <div className="max-h-40 overflow-auto text-xs space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.role === 'user' ? 'bg-background' : 'bg-neutral-900'}`}>
            <div className="text-[11px] opacity-70">{m.role}</div>
            <div className="whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
