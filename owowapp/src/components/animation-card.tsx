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
}

export function AnimationCard({ title, status }: AnimationCardProps) {
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
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOption1();
                }}
              >
                Option 1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOption2();
                }}
              >
                Option 2
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4 overflow-hidden">
          <PixelDisplay size="small" />
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
