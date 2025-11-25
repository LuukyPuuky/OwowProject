"use client"

import { useState } from "react"
import { MoreVertical, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GifFile {
  id: string
  name: string
}

interface Props {
  onClose?: () => void
}

// Content-only GIF upload panel — intended to be rendered inside a shared Modal wrapper.
export default function GifUploadPopup({ onClose }: Props) {
  const [selectedGif, setSelectedGif] = useState<GifFile | null>(null)
  const [gifFiles, setGifFiles] = useState<GifFile[]>([
    { id: "1", name: "sh8nd93n3rh9h39fn2bdb.gif" },
    { id: "2", name: "sh7b39nd93n3rh9h39fn-2 -..." },
  ])
  const [searchInput, setSearchInput] = useState("")

  return (
    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 text-muted-foreground">
      <div className="flex items-start justify-between">
        <h2 className="text-muted-foreground text-2xl font-semibold">Upload a GIF</h2>
        <Button variant="ghost" size="icon" onClick={() => onClose?.()} className="text-muted-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-6">
        {/* Left Section - Preview */}
        <div className="space-y-4">
          {/* Preview Box */}
          <div className="border border-border rounded-xl p-4 bg-card/60">
            <p className="text-muted-foreground/80 text-sm text-center mb-3">Preview</p>
            <div className="bg-background h-32 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-muted-foreground/80 text-sm text-center">Play Preview</p>
          </div>

          <Button variant="outline" className="w-full text-muted-foreground">
            Equip
          </Button>

          <Button className="w-full text-muted-foreground flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>

        {/* Right Section - File List */}
        <div className="border border-border rounded-xl p-4 bg-card/60 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Select_animation.gif"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-card/80 border border-border rounded-lg px-4 py-2 text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-border"
            />
          </div>

          <div className="space-y-2">
            {gifFiles.map((gif) => (
              <div
                key={gif.id}
                className="flex items-center justify-between bg-card/50 border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-border transition-colors"
                onClick={() => setSelectedGif(gif)}
              >
                <span className="text-muted-foreground text-sm truncate">{gif.name}</span>
                <button className="text-muted-foreground/80 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <Button className="w-full mt-4 text-muted-foreground">Save Animations</Button>
        </div>
      </div>
    </div>
  )
}
