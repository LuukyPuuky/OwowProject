"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { PixelDisplay } from "../components/pixel-display";
import { Button } from "@radix-ui/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

interface AnimationCardProps {
  id: string;
  title: string;
  status: string;
  animationType?: string;
  customFrames?: Array<{ dur: number; arr: boolean[] }>;
  thumbnail?: string | boolean[];
  isFavorite?: boolean;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  isEquipped: boolean;
  onEquip: (id: string) => void;
}

export function AnimationCard({
  id,
  title,
  animationType,
  customFrames,
  thumbnail,
  onDelete,
  onFavorite,
  isFavorite,
  isEquipped,
  onEquip,
}: AnimationCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleCardClick = () => {
    onEquip(id);
  };

  const handleAddToFavorites = () => {
    if (onFavorite) {
      onFavorite(id);
    }
  };

  const handleDelete = () => {
    onDelete(id);
  };

  const handleMouseEnter = () => {
    // Small delay to prevent flickering on quick mouse movements
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => {
      setIsAnimating(true);
    }, 100);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsAnimating(false);
  };

  // Always show thumbnail when not animating or when equipped.
  // Clone the thumbnail so the PixelDisplay effect sees a new reference after hover ends and redraws.
  const staticThumbnail =
    (!isAnimating || isEquipped) && Array.isArray(thumbnail)
      ? [...thumbnail]
      : undefined;
  const shouldAnimate = isAnimating && !isEquipped;
  // Force PixelDisplay to remount when switching between animate/static to reset canvas
  const pixelDisplayKey = shouldAnimate
    ? `anim-${id}`
    : `static-${id}-${staticThumbnail ? staticThumbnail.length : 0}`;

  return (
    <div
      className="border-3 border-border rounded-lg bg-card overflow-hidden group hover:border-muted-foreground/50 transition-colors cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-4">
        <div className="flex justify-end mb-2 cursor-pointer">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="shadow-lg bg-card border-2 border-border"
            >
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddToFavorites();
                }}
                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete();
                }}
                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground "
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <PixelDisplay
            key={pixelDisplayKey}
            size="large"
            animationType={shouldAnimate && !customFrames ? (animationType || id) : undefined}
            customFrames={shouldAnimate ? customFrames : undefined}
            autoRefresh={shouldAnimate}
            staticFrame={staticThumbnail}
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-muted-foreground text-center">
            {title}
          </h3>
          <div className="text-center">
            <span
              className="text-sm font-medium"
              style={{ color: isEquipped ? "#494949" : "#707070" }}
            >
              {isEquipped ? "Equipped" : "Equip"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
