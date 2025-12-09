"use client";

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { PixelDisplay } from './pixel-display';

interface Animation {
  id: string;
  title: string;
  equipped: boolean;
  frames?: Array<{ dur: number; arr: boolean[] }>;
}

interface LatestAnimationsProps {
  onAnimationSelect?: (id: string, frames?: Array<{ dur: number; arr: boolean[] }>) => void;
  onMenuClick?: (id: string) => void;
}

export default function LatestAnimations({
  onAnimationSelect,
  onMenuClick,
}: LatestAnimationsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [latestAnimations, setLatestAnimations] = useState<Animation[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Load latest custom animations from localStorage
  useEffect(() => {
    const loadLatestAnimations = () => {
      try {
        const saved = localStorage.getItem('customAnimations');
        if (saved) {
          const allAnimations = JSON.parse(saved);
          // Sort by creation date (newest first) and take latest 4
          const sorted = allAnimations
            .sort((a: { createdAt: string }, b: { createdAt: string }) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .slice(0, 4)
            .map((anim: { id: string; name: string; frames: Array<{ dur: number; arr: boolean[] }> }) => ({
              id: anim.id,
              title: anim.name,
              equipped: false,
              frames: anim.frames
            }));
          setLatestAnimations(sorted);
        }
      } catch (error) {
        console.error('Failed to load latest animations:', error);
      }
    };

    loadLatestAnimations();

    // Listen for updates
    const handleUpdate = () => loadLatestAnimations();
    window.addEventListener('customAnimationsUpdated', handleUpdate);
    return () => window.removeEventListener('customAnimationsUpdated', handleUpdate);
  }, []);

  const displayAnimations = latestAnimations.length > 0 ? latestAnimations : [];

  return (
    <div className="w-full bg-background text-muted-foreground px-8 py-6">
      {/* Header with Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity group"
      >
        <ChevronDown
          size={20}
          className={`transform transition-transform duration-300 ${
            isCollapsed ? '-rotate-90' : 'rotate-0'
          }`}
        />
        <span className="text-base font-medium">Latest Animations</span>
        {!isCollapsed && (
          <span className="text-xs text-neutral-500 ml-auto">
            Collapse to see more controls →
          </span>
        )}
      </button>

      {/* Animations Grid - maintain fixed height to prevent layout shift */}
      <div 
        className={`grid grid-cols-4 gap-4 transition-all duration-300 ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ height: isCollapsed ? '0' : 'auto', overflow: 'hidden' }}
      >
        {displayAnimations.length === 0 ? (
          <div className="col-span-4 text-center text-neutral-500 py-8">
            No custom animations yet. Create one to see it here!
          </div>
        ) : (
          displayAnimations.map((animation) => (
            <div
              key={animation.id}
              onClick={() => onAnimationSelect?.(animation.id, animation.frames)}
              onMouseEnter={() => setHoveredId(animation.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group cursor-pointer"
            >
              {/* Card Container */}
              <div className="border-2 border-neutral-800 rounded-lg bg-card overflow-hidden group-hover:border-neutral-600 transition-colors cursor-pointer">
                <div className="p-3">
                  {/* Three Dot Menu */}
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick?.(animation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground text-sm"
                    >
                      •••
                    </button>
                  </div>

                  {/* Preview Area - Fixed aspect ratio and centering */}
                  <div className="bg-black rounded-md mb-3 overflow-hidden flex items-center justify-center" style={{ height: '80px' }}>
                    {animation.frames ? (
                      <PixelDisplay
                        key={`${animation.id}-${hoveredId === animation.id ? 'play' : 'static'}`}
                        size="mini"
                        // Clone frames so hover toggles always trigger a fresh render cycle
                        customFrames={
                          hoveredId === animation.id
                            ? animation.frames.map((f) => ({ ...f, arr: [...f.arr] }))
                            : undefined
                        }
                        autoRefresh={hoveredId === animation.id}
                        staticFrame={
                          hoveredId !== animation.id && Array.isArray(animation.frames?.[0]?.arr)
                            ? [...animation.frames[0].arr]
                            : undefined
                        }
                      />
                    ) : (
                      <div className="text-neutral-600 text-xs">No preview</div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-muted-foreground text-center text-sm truncate">
                      {animation.title}
                    </h3>
                    <div className="text-center">
                      <span className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                        Click to edit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
