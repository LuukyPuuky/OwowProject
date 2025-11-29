"use client"
import { useState } from 'react'
import CanvasTimeline from '@/components/CanvasTimeline'
import ControlPanel from '@/components/ControlPanel'
import AIChat from '@/components/ai-chat'
import AnimationPreview from '@/components/animation-preview'
import { TopBar as Header } from '@/components/top-bar'
import { Sidebar } from '@/components/sidebar'
import LatestAnimations from '@/components/LatestAnimations'

export default function Page() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [frames, setFrames] = useState([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const favorites = new Set<string>()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFrames, setPreviewFrames] = useState<any[]>([])

  const addFrame = () => {
    setFrames([...frames, { id: frames.length + 1 }])
  }

  const removeFrame = () => {
    if (frames.length > 1) {
      setFrames(frames.filter((_, i) => i !== currentFrame))
      if (currentFrame >= frames.length - 1) {
        setCurrentFrame(Math.max(0, currentFrame - 1))
      }
    }
  }

  const duplicateFrame = () => {
    const newFrame = { id: Math.max(...frames.map((f) => f.id), 0) + 1 }
    const newFrames = [...frames]
    newFrames.splice(currentFrame + 1, 0, newFrame)
    setFrames(newFrames)
  }

  return (
    <div className="relative flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery={""}
        onSearchChange={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={() => {}}
      />

      {/* AI chat overlay positioned above the side menu */}
      <div className="absolute left-0 top-16 z-50 pointer-events-auto">
        <AIChat onGenerate={(generated) => {
          const normalized = generated.map((g, i) => ({ id: i + 1, pixels: (g as any).pixels ?? (g as any) }))
          setFrames(normalized as any)
          setCurrentFrame(0)
          // open preview modal and show generated frames scaled up
          setPreviewFrames(normalized.map((f) => (f as any).pixels ?? f))
          setPreviewOpen(true)
        }} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </div>

        <div className="flex-1 flex overflow-hidden gap-2 px-6">
          {/* Canvas and timeline on the left - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            <CanvasTimeline frames={frames} currentFrame={currentFrame} onFrameSelect={setCurrentFrame} />
          </div>

          {/* Sidebar on the right - fixed width; control panel + AI chat */}
          <div className="w-60 flex-shrink-0 bg-background flex flex-col gap-3 p-3">
            <ControlPanel
              onPlay={() => console.log('Playing')}
              onCreateNew={() => {
                setFrames([{ id: 1 }])
                setCurrentFrame(0)
              }}
              onSave={() => console.log('Saving')}
              onAddFrame={addFrame}
              onDuplicate={duplicateFrame}
              onRemoveFrame={removeFrame}
            />
            {/* AIChat removed from right sidebar — now shows as an overlay above the left sidebar */}
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border bg-background">
          <LatestAnimations
            onAnimationSelect={(id) => console.log('Selected animation:', id)}
            onMenuClick={(id) => console.log('Menu clicked:', id)}
          />
        </div>
      </main>
      <AnimationPreview open={previewOpen} onClose={() => setPreviewOpen(false)} frames={previewFrames} />
    </div>
  )
}
