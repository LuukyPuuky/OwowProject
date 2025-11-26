"use client";

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Animation {
  id: string;
  title: string;
  preview: React.ReactNode;
  equipped: boolean;
}

interface LatestAnimationsProps {
  animations?: Animation[];
  onAnimationSelect?: (id: string) => void;
  onMenuClick?: (id: string) => void;
}

export default function LatestAnimations({
  animations,
  onAnimationSelect,
  onMenuClick,
}: LatestAnimationsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Default animations with star preview
  const defaultAnimations: Animation[] = [
    {
      id: '1',
      title: 'Star animation',
      preview: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,15 61,35 82,35 65,48 73,68 50,55 27,68 35,48 18,35 39,35"
            fill="white"
          />
        </svg>
      ),
      equipped: true,
    },
    {
      id: '2',
      title: 'Star animation',
      preview: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,15 61,35 82,35 65,48 73,68 50,55 27,68 35,48 18,35 39,35"
            fill="white"
          />
        </svg>
      ),
      equipped: false,
    },
    {
      id: '3',
      title: 'Star animation',
      preview: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,15 61,35 82,35 65,48 73,68 50,55 27,68 35,48 18,35 39,35"
            fill="white"
          />
        </svg>
      ),
      equipped: false,
    },
    {
      id: '4',
      title: 'Star animation',
      preview: (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,15 61,35 82,35 65,48 73,68 50,55 27,68 35,48 18,35 39,35"
            fill="white"
          />
        </svg>
      ),
      equipped: false,
    },
  ];

  const displayAnimations = animations || defaultAnimations;

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
        className={`grid grid-cols-4 gap-6 transition-all duration-300 ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ height: isCollapsed ? '0' : 'auto', overflow: 'hidden' }}
      >
        {displayAnimations.map((animation) => (
          <div
            key={animation.id}
            onClick={() => onAnimationSelect?.(animation.id)}
            className="group cursor-pointer"
          >
            {/* Card Container - scaled down to match library style */}
            <div className="border-3 border-border rounded-lg bg-card overflow-hidden group-hover:border-muted-foreground/50 transition-colors cursor-pointer">
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

                {/* Preview Area (smaller) */}
                <div className="aspect-video bg-black rounded-md flex items-center justify-center mb-3 overflow-hidden h-20">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10">{animation.preview}</div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-1">
                  <h3 className="font-medium text-muted-foreground text-center text-sm">
                    {animation.title}
                  </h3>
                  <div className="text-center">
                    <span className="text-xs text-[#494949]">
                      {animation.equipped ? 'Equipped' : 'Equip'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
