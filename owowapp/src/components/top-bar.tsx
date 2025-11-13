"use client";

import { useState } from "react";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("Name");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const handleSortToggle = () => {
    setSortOpen(!sortOpen);
    if (filterOpen) setFilterOpen(false);
  };

  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
    if (sortOpen) setSortOpen(false);
  };
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <Button variant="ghost" onClick={handleSortToggle} className="gap-2">
            {sortOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Sort: {selectedSort}
          </Button>
          {sortOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border-2 border-border rounded-md shadow-lg z-10">
              <div className="py-1">
                {["Name", "Date Created", "Last Modified"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedSort(option);
                      setSortOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={handleFilterToggle}
            className="gap-2"
          >
            {filterOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Filter: {selectedFilter}
          </Button>
          {filterOpen && (
            <div className="absolute top-full right-0  mt-2 w-48 bg-card border-2 border-border rounded-md shadow-lg z-10">
              <div className="py-1">
                {["All", "Favorites", "Recent"].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSelectedFilter(option);
                      setFilterOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
