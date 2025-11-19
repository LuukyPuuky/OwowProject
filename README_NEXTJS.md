# Flipdot Controller

A modern flipdot display animation editor and controller with Next.js UI and Node.js renderer.

## Architecture

**Dual-service design**:
- **Web UI** (`apps/web`): Next.js 15 React application (viewer + animation editor)
- **Renderer** (`src/`): Node.js service (canvas rendering, hardware, playback)

## Quick Start

```bash
# Install dependencies
npm install

# Run both services
npm run dev
```

- **Next.js UI**: http://localhost:3001
  - Viewer: http://localhost:3001/view
  - Animation Editor: http://localhost:3001/anim
- **Renderer API**: http://localhost:3000
  - Legacy UI: http://localhost:3000/view (fallback)

## Project Structure

```
OwowProject/
├── apps/web/              # Next.js UI (TypeScript, React)
│   ├── app/anim/         # Animation editor
│   ├── app/view/         # Viewer/controller
│   └── lib/              # Canvas utils, types
├── src/                  # Node.js renderer
│   ├── index.js         # Render loop
│   ├── preview.js       # HTTP API server
│   └── settings.js      # Display config
└── output/animations.json # Persistent storage
```

## Features

### Viewer
- Live frame preview + flipboard demo
- Scene switcher (mood, clock, tally, ski, fact, next, anim)
- Mood voting, tally game, ski game controls

### Animation Editor
- **Tools**: Brush (circle/square/triangle), Line, Ellipse, Arrow
- **Timeline**: Add/duplicate/delete frames, adjustable duration
- **Onion Skinning**: Preview adjacent frames
- **Text Overlay**: Fetch from API, JSON field extraction
- **Adobe-style Dark UI**: Icon toolbar, round dots, smooth Bresenham strokes

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/frame.png` | GET | Current frame as PNG |
| `/frame.bits` | GET | Current frame as bit array |
| `/scene` | GET/POST | Active scene |
| `/anim/list` | GET | All animations |
| `/anim/state?name=...` | GET/POST | Get/save animation |
| `/anim/select` | POST | Set active animation |
| `/mood` | POST | Submit vote (`{ mood: 'happy'|'sad' }`) |
| `/tallygame/add` | POST | Add point (`{ team: 'A'|'B' }`) |
| `/ski/jump` | POST | Jump |
| `/next` | POST | Set "who is next" name |

## Configuration

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_RENDERER_BASE=http://localhost:3000
```

## Production

```bash
# Build web
npm run build:web

# Run
npm start                    # Renderer
cd apps/web && npm start     # Web UI
```

## Migration Status

✅ Next.js workspace, viewer & editor ported, full feature parity  
⏳ API proxy routes, WebSocket updates  
🔜 Cleanup `owowapp/`, atomic saves, tests, keyboard shortcuts

## Testing Checklist

- [ ] Load/save animations
- [ ] Draw with all tools (brush, line, ellipse, arrow)
- [ ] Smooth strokes (Bresenham interpolation)
- [ ] Onion skin, timeline, duration slider
- [ ] Text overlay config
- [ ] Viewer scenes, mood voting, tally/ski/next

## License

ISC — Original by Stef van Wijchen (OWOW)
