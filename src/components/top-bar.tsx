"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@radix-ui/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import Modal from "@/components/modal";
import GifUploadPopup from "@/components/gif-upload-popup";

interface TopBarProps {
  onToggleSidebar: () => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  filterBy?: string;
  onFilterChange?: (filter: string) => void;
}

export function TopBar({
  onToggleSidebar,
  sortBy = "Name",
  onSortChange,
  filterBy = "All",
  onFilterChange,
}: TopBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Create dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-card text-muted-foreground border-2 border-border px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
              Create
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={6} className="min-w-[12rem] bg-card border-2 border-border rounded-md shadow-lg z-50 p-1">
            <DropdownMenuItem asChild>
              <Link 
                href="/create"
                className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer block"
              >
                Animation Maker
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setUploadOpen(true)}
              className="w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded cursor-pointer"
            >
              Upload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/">
          <button className="bg-card text-muted-foreground border-2 border-border px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            Library
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={handleSortToggle}
            className="flex items-center gap-2 bg-card text-muted-foreground border-2 border-border px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-sm">Sort: {sortBy}</span>
            {sortOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {sortOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border-2 border-border rounded-md shadow-lg z-50 p-1">
              {["Name", "Date Created", "Last Modified"].map(option => (
                <button
                  key={option}
                  onClick={() => {
                    onSortChange?.(option);
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={handleFilterToggle}
            className="flex items-center gap-2 bg-card text-muted-foreground border-2 border-border px-3 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <span className="text-sm">Filter: {filterBy}</span>
            {filterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {filterOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border-2 border-border rounded-md shadow-lg z-50 p-1">
              {["All", "Favorites", "Custom", "Built-in"].map(option => (
                <button
                  key={option}
                  onClick={() => {
                    onFilterChange?.(option);
                    setFilterOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        <Modal open={uploadOpen} onClose={() => setUploadOpen(false)}>
          <GifUploadPopup onClose={() => setUploadOpen(false)} />
        </Modal>
      </div>
    </div>
  );
}
