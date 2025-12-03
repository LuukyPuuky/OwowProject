"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimationCard } from "./animation-card";

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
      id: "1",
      title: "Star animation",
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
      id: "2",
      title: "Star animation",
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
      id: "3",
      title: "Star animation",
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
      id: "4",
      title: "Star animation",
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
            isCollapsed ? "-rotate-90" : "rotate-0"
          }`}
        />
        <span className="text-base font-medium">Latest Animations</span>
      </button>

      {/* Animations Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-4 gap-6 animate-in fade-in duration-300">
          {displayAnimations.map((animation) => (
            <div
              key={animation.id}
              onClick={() => onAnimationSelect?.(animation.id)}
              className="group cursor-pointer"
            >
              {/* Card Container */}
              <AnimationCard
                id={animation.id}
                title={animation.title}
                isEquipped={animation.equipped}
                animationType="star" // Assuming all default animations are of type 'star'
                onDelete={(id: string) => onMenuClick?.(id)}
                onFavorite={(id: string) => onAnimationSelect?.(id)}
                onEquip={(id: string) => onAnimationSelect?.(id)}
                status={""}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
