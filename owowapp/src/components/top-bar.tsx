"use client";

import { Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <Button variant="ghost" size="icon" className="text-muted-foreground">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
        >
          <ChevronDown className="h-4 w-4" />
          Sort
        </Button>
        <Button
          variant="outline"
        >
          <ChevronDown className="h-4 w-4" />
          Filter
        </Button>
      </div>
    </div>
  );
}
