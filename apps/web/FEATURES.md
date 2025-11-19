# Animation Maker Features - ULTIMATE EDITION

## 🎨 Drawing Tools

### Brush Tool (B)
### Fill Tool (F)
- Click to flood fill an area
- Fills all connected pixels with the same state (on/off)
- Smart boundary detection
- Paint or Erase mode
### Eyedropper Tool (I) 🆕
- Click any pixel to sample its state (on/off)
- Auto-switches to brush tool
- Sets paint/erase mode based on sample
- Realistic spray paint effect
- Adjustable density (10-100%)
### UI Features

### Adobe-style Dark Theme
- Professional dark interface
- Icon toolbar with categories
- Tools are optimized for a black/white flipboard (no color picker)
- Smooth transitions
- Click and drag to draw straight lines
### ULTIMATE EDITION Updates
- ✨ **Spray Paint Tool** - Natural spray effect
- 🪞 **Mirror Drawing** - 4 symmetry modes
- 🎯 **Eyedropper Tool** - Sample pixel state (on/off)
### Ellipse Tool (E)
- Click and drag to draw ellipses/circles
- Uses midpoint algorithm for smooth curves
- Preview before releasing

### Rectangle Tool (R)
- Click and drag to draw rectangle outlines
- Preview before releasing
- Perfect for borders and frames

### Fill Tool (F)
- Click to flood fill an area
- Fills all connected pixels of the same color
- Smart boundary detection

### Select Tool (S)
- Click and drag to select a rectangular area
- Press Delete to clear selection
- Visual selection highlight
- Copy/paste selections

### Eyedropper Tool (I) 🆕
- Click any pixel to sample its color
- Auto-switches to brush tool
- Sets paint/erase mode based on sample

## ⌨️ Keyboard Shortcuts - INSANE EDITION

### General
- `Ctrl/Cmd + S` - Save animation
- `Ctrl/Cmd + Z` - Undo (50 levels!)
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + C` - Copy frame 🆕
- `Ctrl/Cmd + V` - Paste frame 🆕
- `Space` - Play/Stop animation

### Tools
- `B` - Brush tool
- `P` - Spray paint tool 🆕
- `L` - Line tool
- `E` - Ellipse tool
- `R` - Rectangle tool
- `F` - Fill tool
- `S` - Select tool
- `I` - Eyedropper tool 🆕
- `M` - Mirror mode 🆕

### Brush
- `[` - Decrease brush size
- `]` - Increase brush size

### Frame Operations
- `Ctrl/Cmd + Backspace` - Clear current frame
- `Ctrl/Cmd + I` - Invert current frame
- `Delete` - Clear selection
- `Arrow Left` - Previous frame
- `Arrow Right` - Next frame

### Transform 🆕
- `Ctrl/Cmd + H` - Flip horizontal
- `Ctrl/Cmd + J` - Flip vertical
- `Ctrl/Cmd + R` - Rotate 90° clockwise
- `Ctrl/Cmd + ←` - Shift frame left
- `Ctrl/Cmd + →` - Shift frame right
- `Ctrl/Cmd + ↑` - Shift frame up
- `Ctrl/Cmd + ↓` - Shift frame down

### View
- `G` - Toggle grid
- `O` - Toggle onion skin

### Mirror Modes 🆕
- `1` - No mirror
- `2` - Horizontal mirror
- `3` - Vertical mirror
- `4` - Both axes mirror

## 🎬 Animation Features

### Timeline
- Add new frames
- Duplicate frames
- Delete frames
- Clear frame
- Invert frame
- **Copy/paste frames** 🆕
- **Reverse all frames** 🆕
- **Double all frames** 🆕
- Drag timeline to see all frames
- Click to jump to frame

### Onion Skin
- Preview previous/next frames
- Adjustable number of frames (0-2)
- Toggle with `O` key
- Previous frames shown in gray
- Next frames shown in lighter gray

### Frame Duration
- Per-frame duration control (10ms - 2000ms)
- Real-time preview with slider
- Displayed in timeline

### Playback 🆕
- Play/Stop with visual feedback
- **Speed control** (0.1x - 3x)
- **Loop toggle**
- **Frame rate display** (1-60 FPS)
- Loops automatically
- Respects frame durations
- Space bar to toggle

## 📐 View Controls

### Zoom
- Adjustable zoom (6px - 20px per cell)
- Smooth scaling
- Slider control

### Grid
- Toggle grid display
- Helps with alignment
- Keyboard shortcut: `G`

## 💾 Animation Management

### Save/Load
- Named animations
- **Auto-save (30 seconds)** 🆕
- Manual save with button or `Ctrl/Cmd + S`
- "Save As" for creating copies
- Auto-save indicator

### Animation List
- Select from existing animations
- Create new animations
- Delete animations
- Set active animation (for rendering)

## ✨ History System

### Undo/Redo
- Up to 50 undo levels
- Works for all drawing operations
- Frame operations included
- Transform operations included 🆕
- Keyboard shortcuts: `Ctrl/Cmd + Z` / `Ctrl/Cmd + Y`

## 🪞 Mirror Drawing 🆕

### Mirror Modes
- **None** (1) - Normal drawing
- **Horizontal** (2) - Mirror across vertical axis
- **Vertical** (3) - Mirror across horizontal axis
- **Both** (4) - Quad symmetry
- Visual indicators in toolbar
- Works with all drawing tools

## 🎨 Transform Operations 🆕

### Flip
- **Flip Horizontal** - Mirror frame left/right
- **Flip Vertical** - Mirror frame top/bottom
- Keyboard shortcuts: `Ctrl+H`, `Ctrl+J`

### Rotate
- **Rotate 90°** - Clockwise rotation
- Keyboard shortcut: `Ctrl+R`
- Preserves as much as possible

### Shift
- **Shift Left/Right/Up/Down** - Move entire frame
- Wraps around edges
- Arrow key shortcuts with Ctrl
- Perfect for repositioning

## ✨ Effects & Filters 🆕

### Dither
- Apply checkerboard pattern
- Creates retro/mesh effect
- One-click application

### Outline
- Extract edges from filled shapes
- Creates outline from solid areas
- Great for hollow effects

### Noise
- **10% Noise** - Light texture
- **25% Noise** - Heavy grain
- Random pixel placement
- Adds organic feel

## 🎯 Selection Features

### Copy/Paste
- Copy current frame to clipboard
- Paste from clipboard
- Independent of undo history
- `Ctrl+C` / `Ctrl+V` shortcuts

### Selection
- Rectangular selection
- Visual highlight
- Delete selection contents
- Clear with Delete key

## 📝 Text Overlay

- Enable/disable text overlay
- Custom API endpoint
- JSON field extraction
- Configurable refresh interval
- Saves with animation

## 🎨 UI Features

### Adobe-style Dark Theme
- Professional dark interface
- Icon toolbar with categories
- Color-coded tools
- Smooth transitions

### Enhanced Panels 🆕
- **Left Panel** - Tools & settings
- **Center Panel** - Canvas & timeline
- **Right Panel** - Playback & frame controls
- **Toolbar** - Quick tool access with mirror modes

### Round Dots
- Circular cell display
- Clean, modern look
- Easy to see individual pixels

### Timeline Preview
- Miniature frame previews
- Shows all frames
- Active frame highlighted
- Quick navigation
- **Extra controls** for batch operations

## 🔧 Technical Features

### Canvas Utilities
- Bresenham line algorithm
- Midpoint ellipse algorithm
- Flood fill algorithm
- Round brush shapes
- **Spray paint randomization** 🆕

### Performance
- Optimized rendering
- Smooth drawing with mouse tracking
- Fast undo/redo
- Efficient state management
- **No jank - draw anywhere!** 🆕

### Data Persistence
- JSON-based storage
- Compatible with renderer
- Per-animation settings
- Text configuration saved
- **Auto-save backup** 🆕

## 🎮 Workflow Tips

1. **Quick Drawing**: Use `B` for brush, `[` and `]` to adjust size
2. **Symmetry**: Press `2`, `3`, or `4` for instant mirror drawing
3. **Spray Effects**: Press `P` and adjust density for textures
4. **Precise Lines**: Use `L` for straight lines, `E` for curves
5. **Fast Fill**: Use `F` to fill large areas quickly
6. **Transform Magic**: `Ctrl+H`/`J`/`R` for instant flips and rotates
7. **Shift Frames**: `Ctrl+Arrows` to reposition entire frames
8. **Iterate Fast**: Use `Space` to preview, `Ctrl+Z` to undo
9. **Frame Navigation**: Use arrow keys to quickly browse frames
10. **Onion Skin**: Press `O` to see previous/next frames while drawing
11. **Grid Toggle**: Press `G` when you need a clean view
12. **Selection Editing**: Use `S` to select, `Delete` to clear areas
13. **Copy/Paste**: `Ctrl+C` to copy frame, `Ctrl+V` to paste
14. **Batch Operations**: Use "Reverse All" or "Double All" for complex animations
15. **Effects**: Try Dither or Outline for instant style changes
16. **Auto-save**: Enable auto-save and never lose work!

## 📊 Specifications

- Canvas: 84×28 pixels
- Max frames: Unlimited
- Frame duration: 10ms - 2000ms
- Brush size: 1-8 pixels
- Spray density: 10-100%
- Undo levels: 50
- Zoom range: 6px - 20px
- Onion skin: 0-2 frames each direction
- Playback speed: 0.1x - 3x
- Frame rate display: 1-60 FPS
- Auto-save interval: 30 seconds
- Mirror modes: 4 (None, H, V, Both)

## 🚀 What's New

### ULTIMATE EDITION Updates
- ✨ **Spray Paint Tool** - Natural spray effect
- 🪞 **Mirror Drawing** - 4 symmetry modes
- 🎨 **Eyedropper Tool** - Sample colors instantly
- 📋 **Copy/Paste Frames** - Duplicate work easily
- 🔄 **Transform Tools** - Flip, rotate, shift
- ✨ **Effects Filters** - Dither, outline, noise
- 🎬 **Playback Controls** - Speed, loop, FPS
- 💾 **Auto-save** - Never lose work
- ⚡ **Smooth Drawing** - No more jank!
- 📦 **Batch Operations** - Reverse/double all frames
- ⌨️ **40+ Shortcuts** - Lightning fast workflow

This is now the most feature-packed pixel animation editor EVER! 🎉

