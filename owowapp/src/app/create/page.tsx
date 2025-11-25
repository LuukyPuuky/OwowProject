"use client"
import { useState } from 'react'
import CanvasTimeline from '@/components/CanvasTimeline'
import ControlPanel from '@/components/ControlPanel'
import { TopBar as Header } from '@/components/top-bar'
import { Sidebar } from '@/components/sidebar'
import LatestAnimations from '@/components/LatestAnimations'

export default function Page() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [frames, setFrames] = useState([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const favorites = new Set<string>()

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
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery={""}
        onSearchChange={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={() => {}}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </div>

        <div className="flex-1 flex overflow-hidden gap-2 px-6">
          {/* Canvas and timeline on the left - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            <CanvasTimeline frames={frames} currentFrame={currentFrame} onFrameSelect={setCurrentFrame} />
          </div>

          {/* Sidebar on the right - fixed width */}
          <div className="w-60 flex-shrink-0 bg-background">
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
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border bg-background">
          <LatestAnimations
            onAnimationSelect={(id) => console.log('Selected animation:', id)}
            onMenuClick={(id) => console.log('Menu clicked:', id)}
          />
        </div>
      </main>
    </div>
  )
}
