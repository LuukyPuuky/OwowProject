# Owow Billboard Project

A modern web application for controlling an Owow flipdot billboard display. This project allows you to create, upload, and manage animated content for a 112x16 pixel LED display using pixel-art animations, GIF uploads, and custom animations.

## Overview

The Owow Billboard Project is a full-stack application built with:
- **Frontend**: Next.js 15 with React 19 (TypeScript)
- **Styling**: Tailwind CSS
- **Canvas Rendering**: Animation rendering
- **Component Library**: Shadcn UI with Radix UI

The application provides a web-based interface to manage and preview animations that can be displayed on the Owow physical flipdot billboard hardware.

## Features

### Core Functionality
- **Flipdot Display Simulation**: 80x20 pixel web-based canvas preview
- **Animation Library**: Pre-built animations including:
  - Text Scroll: Horizontal text scrolling
  - Wave: Sine wave visualization
  - Timer: Countdown timer display
  - Logo: Logo
- **GIF Upload & Management**: Upload and manage multiple GIF files
- **Custom Animations**: Modular animation system for creating custom effects
- **Real-time Preview**: Live preview of animations on the web canvas

### UI Components
- **Animation Grid**: Browse and select from available animations
- **Control Panel**: Manage animation playback and settings
- **Editor Canvas**: Pixel-art canvas editor
- **Timeline Editor**: Frame-by-frame animation control
- **Brush Settings**: Pixel drawing tools and color selection
- **Project Header**: Display project information and status
- **Sidebar Navigation**: Quick access to features
- **Top Bar**: Global controls and settings

## Project Structure


OwowProject/
│ └── src/
│ ├── app/ # Next.js app directory
│ │ ├── layout.tsx # Root layout
│ │ ├── page.tsx # Home page
│ │ ├── create/ # Creation/editor pages
│ │ └── api/ # API routes
│ │ ├── preview/ # Animation preview rendering
│ │ ├── animations/ # Animation list endpoint
│ │ ├── gifs/ # GIF management endpoint
│ │ └── upload/ # File upload endpoint
│ ├── components/ # React components
│ │ ├── animation-.tsx # Animation-related components
│ │ ├── editor-.tsx # Editor components
│ │ ├── pixel-*.tsx # Canvas and display components
│ │ ├── brush-settings.tsx
│ │ ├── control-panel.tsx
│ │ └── ui/ # Shadcn UI components
│ ├── hooks/ # Custom React hooks
│ │ ├── useAnimationFrames.ts
│ │ ├── useDrawingTools.ts
│ │ ├── useHistory.ts
│ │ ├── useModalDialog.ts
│ │ ├── useProjectActions.ts
│ │ └── useProjectPersistence.ts
│ ├── lib/ # Utilities and helpers
│ │ ├── canvas/ # Canvas rendering utilities
│ │ ├── animations/ # Animation implementations
│ │ ├── storage/ # Data storage utilities
│ │ ├── display/ # Display configuration
│ │ ├── types/ # TypeScript type definitions
│ │ └── utils.ts
│ └── globals.css # Global styles
├── public/ # Static assets
│ └── fonts/ # Font files
└── package.json # Dependencies and scripts 


## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Windows PowerShell or terminal with npm support

### Frontend Setup

1. **Navigate to the project directory:**
```powershell
cd "c:\OwowProject"

Install dependencies: 

npm install
# or
pnpm install

Run the development server:

 npm run dev
# or
pnpm dev

Open the application:

Navigate to http://localhost:3000 in your browser
Building for Production

npm run build
npm start

Available Scripts
Development 

Production
npm run dev          # Start Next.js development server with Turbopack 
npm start            # Start the production server

Linting 
npm run lint         # Run ESLint

Key Components
Animation System
Located in animations:

index.ts: Exports all animation functions
star-bounce.ts: Bouncing square animation
text-scroll.ts: Scrolling text effect
wave.ts: Wave pattern visualization
timer.ts: Timer display animation
logo.ts: Logo animation with pulsing effect

Animation functions follow the signature:

export function animationName(
  ctx: CanvasRenderingContext2D,
  frame: number,
  width: number,
  height: number
): void 

Canvas Utilities
Located in canvas:

animation-engine.ts: Frame-by-frame animation rendering
utils.ts: Helper functions for canvas operations
Custom Hooks
useAnimationFrames: Manage animation frame state
useDrawingTools: Handle pixel drawing tools
useHistory: Undo/redo functionality
useProjectPersistence: Save/load projects
useProjectActions: Project operations
API Routes
Preview Animation
GET /api/preview?animation=<name>

Renders an animation frame to PNG
Returns base64-encoded PNG image
Get Animations
GET /api/animations

Returns list of available animations
Upload GIF
POST /api/upload

Accepts multipart GIF/image file upload
Returns upload status and file info
Get GIFs
GET /api/gifs

Returns list of uploaded GIF files

Display Specifications

Resolution: 112x16 pixels
Type: Owow flipdot display
Supported Content: Pixel-art animations, GIFs, custom animations
Color: Monochrome (on/off per pixel)

Technology Stack

Frontend Dependencies

Next.js 15.5.2: React framework with server-side rendering
React 19.1.0: UI library
TypeScript 5: Type-safe development
Tailwind CSS 4: Utility-first CSS framework
Radix UI: Unstyled, accessible component primitives
Lucide React: Icon library
Canvas: For pixel rendering and animation

Development Dependencies

ESLint 9: Code linting
Tailwind CSS: CSS framework
TypeScript: Type checking

Configuration Files

tsconfig.json: TypeScript configuration
tailwind.config.ts: Tailwind CSS customization
next.config.ts: Next.js configuration
postcss.config.mjs: PostCSS configuration
eslint.config.mjs: ESLint rules
components.json: Shadcn UI configuration

Usage Guide

Creating an Animation

Navigate to the Create/Editor page
Use the pixel canvas to draw frames
Use the timeline editor to arrange frames
Preview animations in real-time
Uploading a GIF

Click the upload button
Select a GIF or image file
Wait for upload to complete
Use the uploaded animation in your projects

Previewing Animations

Animations are displayed in real-time on the 112x16 pixel canvas
Use the playback controls to pause/play animations
Adjust animation speed and settings as needed

Development Workflow

Hot Reload
The development server supports hot module replacement (HMR) for instant feedback during development.

TypeScript Checking
All code is type-checked with TypeScript for safer development.

ESLint
Code quality is maintained with ESLint configuration following Next.js best practices.

Browser Support

Chrome/Chromium 90+
Firefox 88+
Safari 14+
Edge 90+

Styling

The project uses:

Tailwind CSS for utility-based styling
CSS Modules for component-scoped styles
Radix UI for accessible component primitives
Shadcn UI for pre-built components

Performance Optimization

Turbopack: Next.js bundler for faster builds
Image Optimization: Automatic image optimization
Code Splitting: Automatic code splitting with Next.js
Canvas Rendering: Efficient pixel-by-pixel rendering

Troubleshooting
Port Already in Use
If port 3000 is already in use:

npm run dev -- -p 3001 

 Module Not Found Errors
Clear the .next folder and reinstall dependencies:

rm -r .next; rm -r node_modules; npm install

Canvas Rendering Issues

Ensure your browser supports HTML5 Canvas API with 2D context.

License 
n/a 

Resources
Next.js Documentation
React Documentation
Tailwind CSS Documentation
Shadcn UI Components
Canvas API Documentation 


