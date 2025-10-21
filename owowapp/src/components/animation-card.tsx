"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "../components/ui/button";
import { PixelDisplay } from "../components/pixel-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AnimationCardProps {
  title: string;
  status: string;
  animationType?: string;
}

export function AnimationCard({
  title,
  status,
  animationType,
}: AnimationCardProps) {
  const [isEquipped, setIsEquipped] = useState(false);

  const handleCardClick = () => {
    setIsEquipped(!isEquipped);
  };

  const handleOption1 = () => {
    // TODO: Add your first option logic here
    console.log("Option 1 clicked for:", title);
  };

  const handleOption2 = () => {
    // TODO: Add your second option logic here
    console.log("Option 2 clicked for:", title);
  };

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
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer pointer-events-auto"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="shadow-lg bg-card border-2 border-border "
            >
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleOption1();
                }}
                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Add to Favorites
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  handleOption2();
                }}
                className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground "
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          <PixelDisplay size="small" animationType={animationType} />
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
