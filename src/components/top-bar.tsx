"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  const handleSortToggle = () => {
    setSortOpen(!sortOpen);
    if (filterOpen) setFilterOpen(false);
  };

  const handleFilterToggle = () => {
    setFilterOpen(!filterOpen);
    if (sortOpen) setSortOpen(false);
  };

  const handleNavClick = () => {
    setIsNavigating(true);
    // Reset after a delay to show the indicator
    setTimeout(() => setIsNavigating(false), 3000);
  };

  return (
    <>
      {/* Loading Indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-50">
          <div className="h-full bg-blue-300 animate-[loading_1s_ease-in-out_infinite]"></div>
        </div>
      )}
      
      {/* Current Page Indicator */}
      <div className="fixed top-0 right-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold z-50 rounded-bl">
        Current: {pathname}
      </div>

      <div className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Create & Library buttons next to collapse */}
        <Link href="/create" onClick={handleNavClick}>
          <Button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3] hover:cursor-pointer">
            Create
          </Button>
        </Link>
        <Link href="/" onClick={handleNavClick}>
          <Button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3] hover:cursor-pointer">
            Library
          </Button>
        </Link>
        <Link href="/create" onClick={handleNavClick}>
          <Button className="bg-[#2f2f2f] text-[#ffcc00] border-2 border-[#ffcc00] px-3 py-1 rounded-md focus:outline-none hover:bg-[#3f3f3f] hover:text-[#ffcc00] hover:cursor-pointer">
            TEST Create
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            onClick={handleSortToggle}
            className="gap-2 bg-[#1f1f1f] text-[#c3c3c3] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3]"
          >
            {sortOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
            className="gap-2 bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3]"
          >
            {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Filter: {selectedFilter}
          </Button>
          {filterOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border-2 border-border rounded-md shadow-lg z-10">
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
    </>
  );
}
