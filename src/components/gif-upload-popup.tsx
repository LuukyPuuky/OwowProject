"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Upload, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GifFile {
  id: string;
  name: string;
}

interface Props {
  onClose?: () => void;
  onUploaded?: () => void;
}

export default function GifUploadPopup({ onClose, onUploaded }: Props) {
  const [selectedGif, setSelectedGif] = useState<GifFile | null>(null);
  const [gifFiles, setGifFiles] = useState<GifFile[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ CHANGED: Use Next.js API routes instead of external backend
  const uploadUrl = "/api/upload";
  const listUrl = "/api/gifs";

  useEffect(() => {
    // load initial list
    fetchList();
    // listen for global upload events
    const handler = () => fetchList();
    window.addEventListener("uploads:updated", handler);
    return () => {
      window.removeEventListener("uploads:updated", handler);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchList() {
    try {
      const res = await fetch(listUrl);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.gifs)) {
        const files = json.gifs.map((name: string, idx: number) => ({
          id: String(idx + Date.now()),
          name,
        }));
        setGifFiles(files);
      }
    } catch (e) {
      console.warn("Failed to fetch gif list", e);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    setSelectedFiles(files);
    if (!files || files.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
  }

  async function handleUpload() {
    if (!selectedFiles || selectedFiles.length === 0) {
      setStatus("Select one or more files first.");
      return;
    }

    setStatus("Uploading...");
    const fd = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      fd.append("images", selectedFiles[i]);
    }

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText} ${text}`);
      }

      const json = await res.json();
      setStatus(
        "Upload complete: " +
          (json.uploaded?.map?.((x: any) => x.name).join(", ") || "ok")
      );

      // refresh saved gifs from backend so UI shows newly uploaded items
      await fetchList();

      // notify app to refresh other parts
      window.dispatchEvent(
        new CustomEvent("uploads:updated", { detail: json })
      );
      onUploaded?.();

      // clear selection
      setSelectedFiles(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Upload error", err);
      setStatus("Upload failed: " + (err?.message || "unknown"));
    }
  }

  // ✅ NEW: Handle preview for selected GIF from list
  function handleGifSelect(gif: GifFile) {
    setSelectedGif(gif);
    // Show preview from public folder
    setPreviewUrl(`/gifs/${gif.name}`);
    setStatus(`Selected ${gif.name}`);
  }

  return (
    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 text-muted-foreground">
      <div className="flex items-start justify-between">
        <h2 className="text-muted-foreground text-2xl font-semibold">
          Upload a GIF / Image
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onClose?.()}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-6">
        {/* Left Section - Preview */}
        <div className="space-y-4">
          {/* Preview Box */}
          <div className="border border-border rounded-xl p-4 bg-card/60">
            <p className="text-muted-foreground/80 text-sm text-center mb-3">
              Preview
            </p>
            <div className="bg-background h-32 rounded-lg flex items-center justify-center mb-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-28 object-contain"
                />
              ) : (
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            <p className="text-muted-foreground/80 text-sm text-center">
              Play Preview
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full text-muted-foreground"
            onClick={() => {
              if (selectedGif) setStatus(`Equipped ${selectedGif.name}`);
              else setStatus("Select a file from the list or upload one.");
            }}
          >
            Equip
          </Button>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="gif-upload-input"
            />
            <Button
              className="w-full text-muted-foreground flex items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Select files
            </Button>

            <Button
              className="w-full text-muted-foreground flex items-center justify-center gap-2"
              onClick={handleUpload}
              disabled={!selectedFiles}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>

          {status && (
            <p className="text-sm text-muted-foreground/80 mt-2">{status}</p>
          )}
        </div>

        {/* Right Section - File List */}
        <div className="border border-border rounded-xl p-4 bg-card/60 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Filter saved animations..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-card/80 border border-border rounded-lg px-4 py-2 text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-border"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {gifFiles
              .filter((g) =>
                g.name.toLowerCase().includes(searchInput.toLowerCase())
              )
              .map((gif) => (
                <div
                  key={gif.id}
                  className={`flex items-center justify-between bg-card/50 border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-border transition-colors ${
                    selectedGif?.id === gif.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleGifSelect(gif)}
                >
                  <span className="text-muted-foreground text-sm truncate">
                    {gif.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-muted-foreground/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <button
                      className="text-muted-foreground/80 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGifSelect(gif);
                      }}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <Button
            className="w-full mt-4 text-muted-foreground"
            onClick={() => setStatus("Animations saved locally")}
          >
            Save Animations
          </Button>
        </div>
      </div>
    </div>
  );
}
