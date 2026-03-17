# 📸 LUMISNAP — Photo Studio

A feature-rich, mobile-first photo booth web app built with React + TypeScript. Take single shots, animated photo strips, and GIFs — directly in your browser, no installation required.
 
![License](https://img.shields.io/badge/license-MIT-red.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
 
---

## 📁 Project Structure
 
```
lumisnap/
├── public/
│   └── camera.svg              # Favicon
├── src/
│   ├── components/
│   │   ├── CameraPreview.tsx   # Live video feed with filters & CRT overlay
│   │   ├── CaptureButton.tsx   # Shutter button with strip/GIF progress
│   │   ├── ControlBar.tsx      # Mode selector + tool icons
│   │   ├── CountdownOverlay.tsx# Fullscreen countdown animation
│   │   ├── FilterSelector.tsx  # Horizontal filter thumbnail strip
│   │   ├── FlashOverlay.tsx    # White flash on capture
│   │   ├── GalleryDrawer.tsx   # Photo/strip/GIF gallery bottom drawer
│   │   ├── GifRecordingOverlay.tsx # REC indicator + progress bar
│   │   ├── GifResultModal.tsx  # GIF preview + download modal
│   │   ├── Header.tsx          # Logo + live status indicator
│   │   ├── QRDownloadModal.tsx # QR code for mobile download
│   │   ├── StickerLayer.tsx    # Draggable/scalable/rotatable stickers
│   │   ├── StickerPicker.tsx   # Emoji picker bottom sheet
│   │   ├── StripProgress.tsx   # In-progress strip thumbnail sidebar
│   │   ├── StripResultModal.tsx# Strip preview + template switcher
│   │   └── StripTemplateBar.tsx# Compact template selector bar
│   ├── hooks/
│   │   ├── useCamera.ts        # Camera stream management + device switching
│   │   ├── useCountdown.ts     # Countdown timer logic
│   │   ├── useGallery.ts       # Gallery state + localStorage sync
│   │   ├── useGifRecorder.ts   # Frame capture + GIF encoding orchestration
│   │   └── useStickers.ts      # Sticker add/move/scale/rotate/delete
│   ├── services/
│   │   ├── cameraService.ts    # Cross-device getUserMedia with fallback strategies
│   │   └── storageService.ts   # localStorage read/write with quota handling
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── filters.ts          # CSS + canvas filter definitions
│   │   ├── gifEncoder.ts       # Pure-JS GIF89a encoder (LZW + median-cut palette)
│   │   ├── photoUtils.ts       # captureFrame, buildPhotoStrip, sticker baking
│   │   ├── qrCode.ts           # Pure-JS QR code generator (RS error correction)
│   │   ├── StripTemplates.ts   # 10 canvas-rendered strip templates
│   │   └── stickers.ts         # Sticker category definitions
│   ├── App.tsx                 # Root component, layout, all state
│   ├── main.tsx                # React DOM entry point
│   └── index.css               # Tailwind base + custom animations + scrollbar utils
└── index.html                  # Shell HTML with PWA meta tags
```

---

## 🚀 Getting Started
```bash
# Clone the repository
git clone https://github.com/your-username/lumisnap.git
cd lumisnap
 
# Install dependencies
npm install
 
# Start development server
npm run dev
```

---

## ✨ Features
 
----------------------
| Mode | Description |
|------|-------------|-------------------------------------------------------------------------
| **Single Shot**    | Capture one photo instantly with optional countdown                    |
| **Strip Mode**     | Auto-shoots 4 consecutive photos and compiles them into a styled strip |
| **GIF Mode**       | Records a 3-second animated GIF at 8fps directly from the camera       |
-----------------------------------------------------------------------------------------------

## 🎨 Filters

6 real-time CSS + canvas filters applied both to the live preview and the final captured image:
- **Normal** — no filter
- **B&W** — full grayscale conversion
- **Sepia** — warm sepia tone
- **Vintage** — warm tint with vignette overlay
- **Punch** — high contrast + saturated
- **Mirror** — horizontal flip

## 🎞️ Strip Templates

10 unique photo strip layouts, each with a live rendered preview before you shoot:
--------------------
| Template | Style |
|------|-----------|---------------------------------------
| 🎞️ Classic      | Clean darkroom aesthetic             |
| 🌃 Neon Night   | Cyberpunk glow with grid background  |
| 📸 Polaroid     | Tilted Polaroid cards with captions  |
| 💥 Comic Strip  | POW! BAM! Ben-day dots               |
| 🎬 Film Noir    | Black & white cinematic mood         |
| 🌸 Kawaii       | Pastel hearts, cute style            |
| 📰 Gazette      | Vintage newspaper layout             |
| 🕹️ Arcade       | Retro pixel game UI                  |
| 🌅 Golden Hour  | Warm sunset tones                    |
| 🎉 Party        | Confetti explosion                   |
|------------------|---------------------------------------

## 😄 Stickers

- 30+ emoji stickers across 4 categories: **Fun**, **Faces**, **Props**, **Love**
- **Drag** to reposition anywhere on the frame
- **Scale** with +/− buttons or mouse wheel
- **Rotate** freely with drag handle
- Stickers are **baked into the final photo** on capture (rendered directly to canvas)
 
## ⏱️ Countdown Timer

- Toggle on/off
- Choose 3s or 5s delay
- Animated fullscreen countdown overlay with "SMILE!" prompt
 
## 🖼️ Gallery

- View all captured **photos**, **strips**, and **GIFs** in a tabbed drawer
- **Download** any item as PNG or GIF
- **QR code** generator for quick mobile download of individual photos
- **Delete** individual items or clear all

## 🔒 Privacy

LumiSnap runs entirely in your browser:
- **No server** zero backend, zero data transmission
- **No analytics** no tracking scripts
- **Camera feed** never leaves your device
- **Photos stored locally** - in `localStorage` only
- **QR code feature** encodes a thumbnail fragment locally — no upload
 
---

<div align="center">
  <p>Made with ❤️</p>
  <p>
    <strong>LUMISNAP</strong> — capture the moment, keep the vibe.
  </p>
</div>
