"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/modal";
import GifUploadPopup from "@/components/gif-upload-popup";

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
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
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
        {/* Create dropdown & Library button next to collapse */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-card text-muted-foreground border-2 border-border px-3 py-1 rounded-md focus:outline-none hover:bg-card hover:text-muted-foreground">
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={6} className="min-w-[12rem]">
            <DropdownMenuItem onClick={() => router.push('/create')}>Animation Maker</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUploadOpen(true)}>Upload</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link href="/">
          <Button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3] hover:cursor-pointer">
            Library
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
        {/* Upload Modal rendered when Upload is selected from Create dropdown */}
        <Modal open={uploadOpen} onClose={() => setUploadOpen(false)}>
          <GifUploadPopup onClose={() => setUploadOpen(false)} />
        </Modal>
      </div>
    </div>
  );
}
