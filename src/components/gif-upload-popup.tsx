"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Upload, X, Play } from "lucide-react";
import { Button } from "@radix-ui/themes";
import { parseGIF, decompressFrames } from "gifuct-js";
import { applyFloydSteinbergDithering } from "@/lib/dithering";
import pica from "pica";

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
  const [useDithering, setUseDithering] = useState(true);
  const [resizingMethod, setResizingMethod] = useState<"nearest" | "lanczos">("lanczos");
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
                  style={{ imageRendering: "pixelated" }}
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

          <div className="flex flex-col space-y-3 mb-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dithering"
                checked={useDithering}
                onChange={(e) => setUseDithering(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="dithering"
                className="text-sm font-medium leading-none"
              >
                Use Dithering
              </label>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Resizing Method</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resizing"
                    value="lanczos"
                    checked={resizingMethod === "lanczos"}
                    onChange={() => setResizingMethod("lanczos")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Lanczos (Smooth)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="resizing"
                    value="nearest"
                    checked={resizingMethod === "nearest"}
                    onChange={() => setResizingMethod("nearest")}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Nearest (Pixel)</span>
                </label>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full text-muted-foreground"
            onClick={async () => {
              if (selectedGif && previewUrl) {
                setStatus(`Processing ${selectedGif.name}...`);
                try {
                  const framesToSave: { dur: number; arr: boolean[] }[] = [];
                  const width = 80;
                  const height = 20;

                  // 1. Fetch file data
                  const response = await fetch(previewUrl);
                  const buffer = await response.arrayBuffer();

                  // Check if it's a GIF
                  const isGif = selectedGif.name.toLowerCase().endsWith('.gif');

                  if (isGif) {
                    // --- Animated GIF Handling ---
                    const gif = parseGIF(buffer);
                    const frames = decompressFrames(gif, true); // true = build patch

                    // Create canvas for frame composition
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (!ctx) throw new Error("Could not get canvas context");
                    ctx.imageSmoothingEnabled = false;

                    // Temporary canvas to draw the raw frame
                    const tempCanvas = document.createElement("canvas");
                    // We need to size temp canvas to GIF dimensions
                    // Note: gifuct-js frames usually have dims from the frame header
                    // But we'll rely on response-driven sizing or assume resizing to target

                    // Create pica instance once if needed
                    const picaInstance = resizingMethod === "lanczos" ? pica() : null;

                    for (let i = 0; i < frames.length; i++) {
                      // Update progress
                      if (i % 2 === 0 || i === frames.length - 1) { // Update every other frame to reduce React renders
                        setStatus(`Processing frame ${i + 1}/${frames.length}...`);
                        // Allow UI to update
                        await new Promise(r => requestAnimationFrame(r));
                      }

                      const frame = frames[i];

                      // For simplicity, we create an ImageData from the frame patch
                      // and draw it to our canvas, resizing it.
                      // Since frame.patch is raw pixels of the frame dimensions
                      const patchData = new Uint8ClampedArray(frame.patch);
                      const frameImageData = new ImageData(
                        patchData,
                        frame.dims.width,
                        frame.dims.height
                      );

                      // Create a temp canvas for this specific frame patch
                      tempCanvas.width = frame.dims.width;
                      tempCanvas.height = frame.dims.height;
                      const tempCtx = tempCanvas.getContext("2d");
                      if (tempCtx) { // Ensure tempCtx is not null
                        tempCtx.putImageData(frameImageData, 0, 0);
                      }


                      // Draw to main canvas (Resizing)
                      if (i === 0) {
                        ctx.fillStyle = "black";
                        ctx.fillRect(0, 0, width, height);
                      }

                      if (resizingMethod === "lanczos" && picaInstance) {
                        // Use reusable pica instance
                        await picaInstance.resize(tempCanvas, canvas, {
                          quality: 3,
                          // alpha is handled automatically
                          unsharpAmount: 0,
                          unsharpRadius: 0,
                          unsharpThreshold: 0
                        });
                      } else {
                        // Nearest neighbor / standard canvas draw
                        ctx.imageSmoothingEnabled = false;
                        ctx.drawImage(tempCanvas, 0, 0, width, height);
                      }

                      // Read pixels 
                      const imageData = ctx.getImageData(0, 0, width, height);

                      if (useDithering) {
                        applyFloydSteinbergDithering(imageData);
                      }

                      const pixels = imageData.data;
                      const boolArray: boolean[] = new Array(width * height).fill(false);

                      for (let p = 0; p < width * height; p++) {
                        // If dithered, pixels are already 0 or 255. 
                        // If not dithered, we still need to threshold.
                        if (useDithering) {
                          boolArray[p] = pixels[p * 4] > 128;
                        } else {
                          const r = pixels[p * 4];
                          const g = pixels[p * 4 + 1];
                          const b = pixels[p * 4 + 2];
                          const brightness = (r + g + b) / 3;
                          boolArray[p] = brightness > 128;
                        }
                      }

                      framesToSave.push({
                        dur: frame.delay, // delay is in ms
                        arr: boolArray,
                      });
                    }
                  } else {
                    // --- Static Image Handling ---
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    // Need to wait for blob to be ready as image
                    await new Promise((resolve, reject) => {
                      img.onload = resolve;
                      img.onerror = reject;
                      img.src = previewUrl;
                    });

                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) throw new Error("Could not get canvas context");

                    if (resizingMethod === "lanczos") {
                      // We need a temp canvas for the source image
                      const tempCanvas = document.createElement("canvas");
                      tempCanvas.width = img.naturalWidth;
                      tempCanvas.height = img.naturalHeight;
                      const tempCtx = tempCanvas.getContext("2d");
                      if (tempCtx) {
                        tempCtx.drawImage(img, 0, 0);
                        const picaInstance = pica();
                        await picaInstance.resize(tempCanvas, canvas, {
                          quality: 3,
                          // alpha is handled automatically
                        });
                      }
                    } else {
                      ctx.imageSmoothingEnabled = false;
                      ctx.drawImage(img, 0, 0, width, height);
                    }

                    const imageData = ctx.getImageData(0, 0, width, height);

                    if (useDithering) {
                      applyFloydSteinbergDithering(imageData);
                    }

                    const pixels = imageData.data;
                    const boolArray: boolean[] = new Array(width * height).fill(false);

                    for (let i = 0; i < width * height; i++) {
                      if (useDithering) {
                        boolArray[i] = pixels[i * 4] > 128;
                      } else {
                        const r = pixels[i * 4];
                        const g = pixels[i * 4 + 1];
                        const b = pixels[i * 4 + 2];
                        const brightness = (r + g + b) / 3;
                        boolArray[i] = brightness > 128;
                      }
                    }

                    framesToSave.push({ dur: 1000, arr: boolArray });
                  }

                  if (framesToSave.length === 0) {
                    throw new Error("No frames extracted");
                  }

                  // 4. Save to localStorage as Custom Animation
                  const newAnimation = {
                    id: `custom-${Date.now()}`,
                    name: selectedGif.name.replace(/\.[^/.]+$/, ""), // Remove extension
                    frames: framesToSave,
                    createdAt: new Date().toISOString(),
                    status: 'Custom'
                  };

                  const existing = localStorage.getItem('customAnimations');
                  const customAnimations = existing ? JSON.parse(existing) : [];
                  customAnimations.unshift(newAnimation);
                  localStorage.setItem('customAnimations', JSON.stringify(customAnimations));

                  // Notify app
                  window.dispatchEvent(new Event('customAnimationsUpdated'));

                  setStatus(`Saved "${newAnimation.name}" with ${framesToSave.length} frames!`);

                  setTimeout(() => {
                    onClose?.();
                  }, 1500);

                } catch (err) {
                  console.error("Failed to process image", err);
                  setStatus("Failed to process image.");
                }
              } else {
                setStatus("Select a file from the list or upload one.");
              }
            }}
          >
            Import to Library
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
                  className={`flex items-center justify-between bg-card/50 border border-border rounded-lg px-4 py-3 cursor-pointer hover:border-border transition-colors ${selectedGif?.id === gif.id ? "ring-2 ring-primary" : ""
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
            onClick={() => setStatus("Select an image to import")}
          >
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}
