// src/components/StickerLayer.tsx
// Changes:
//  - Added onRotate prop + rotate handle (drag to spin)
//  - Controls visible on tap/select (mobile-friendly, no hover dependency)
//  - Selection ring when active

import React, { useRef, useCallback, useState } from 'react';
import type { Sticker } from '../types';

interface Props {
  stickers:     Sticker[];
  onMove:       (id: string, x: number, y: number) => void;
  onDelete:     (id: string) => void;
  onScale:      (id: string, delta: number) => void;
  onRotate:     (id: string, deg: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const StickerLayer: React.FC<Props> = ({
  stickers, onMove, onDelete, onScale, onRotate, containerRef,
}) => {
  if (stickers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none touch-none">
      {stickers.map(sticker => (
        <DraggableSticker
          key={sticker.id}
          sticker={sticker}
          onMove={onMove}
          onDelete={onDelete}
          onScale={onScale}
          onRotate={onRotate}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
};

// ─── DraggableSticker ─────────────────────────────────────────────────────────

interface DraggableStickerProps {
  sticker:      Sticker;
  onMove:       (id: string, x: number, y: number) => void;
  onDelete:     (id: string) => void;
  onScale:      (id: string, delta: number) => void;
  onRotate:     (id: string, deg: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({
  sticker, onMove, onDelete, onScale, onRotate, containerRef,
}) => {
  const [selected, setSelected] = useState(false);

  // drag
  const isDragging   = useRef(false);
  const dragOffset   = useRef({ x: 0, y: 0 });
  const didDrag      = useRef(false);

  // rotate
  const isRotating        = useRef(false);
  const rotateStartAngle  = useRef(0);
  const rotateStartDeg    = useRef(0);

  const getRect = () =>
    containerRef.current?.getBoundingClientRect() ??
    { left: 0, top: 0, width: 1, height: 1 };

  const stickerCenter = useCallback(() => {
    const rect = getRect();
    return {
      x: sticker.x * rect.width  + rect.left,
      y: sticker.y * rect.height + rect.top,
    };
  }, [sticker.x, sticker.y]);

  const angleTo = useCallback((cx: number, cy: number) => {
    const c = stickerCenter();
    return Math.atan2(cy - c.y, cx - c.x) * (180 / Math.PI);
  }, [stickerCenter]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    didDrag.current    = false;
    const c = stickerCenter();
    dragOffset.current = { x: e.clientX - c.x, y: e.clientY - c.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [stickerCenter]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    didDrag.current = true;
    const rect = getRect();
    const rawX = e.clientX - dragOffset.current.x - rect.left;
    const rawY = e.clientY - dragOffset.current.y - rect.top;
    onMove(
      sticker.id,
      Math.max(0, Math.min(1, rawX / rect.width)),
      Math.max(0, Math.min(1, rawY / rect.height)),
    );
  }, [sticker.id, onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Tap to toggle selection (only if not dragged)
  const handleClick = useCallback(() => {
    if (!didDrag.current) setSelected(s => !s);
  }, []);

  // ── Rotate handle ─────────────────────────────────────────────────────────
  const handleRotateDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isRotating.current      = true;
    rotateStartAngle.current = angleTo(e.clientX, e.clientY);
    rotateStartDeg.current   = sticker.rotation;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [angleTo, sticker.rotation]);

  const handleRotateMove = useCallback((e: React.PointerEvent) => {
    if (!isRotating.current) return;
    e.preventDefault();
    const delta = angleTo(e.clientX, e.clientY) - rotateStartAngle.current;
    onRotate(sticker.id, rotateStartDeg.current + delta);
  }, [sticker.id, angleTo, onRotate]);

  const handleRotateUp = useCallback((e: React.PointerEvent) => {
    isRotating.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // ── Wheel to scale ────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    onScale(sticker.id, e.deltaY > 0 ? -0.1 : 0.1);
  }, [sticker.id, onScale]);

  const fontSize   = Math.round(sticker.scale * 36);
  const CTRL       = 22; // control button size px
  const CTRL_HALF  = CTRL / 2 + 5;

  return (
    <div
      className="absolute pointer-events-auto select-none"
      style={{
        left:        `${sticker.x * 100}%`,
        top:         `${sticker.y * 100}%`,
        transform:   `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        cursor:      'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* ── Emoji ── */}
      <span
        style={{
          fontSize:   `${fontSize}px`,
          lineHeight: 1,
          display:    'block',
          filter:     'drop-shadow(0 2px 5px rgba(0,0,0,0.55))',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {sticker.emoji}
      </span>

      {/* ── Controls (visible when selected) ── */}

      {/* DELETE — top right */}
      <button
        onPointerDown={e => { e.stopPropagation(); onDelete(sticker.id); }}
        className={`absolute flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-opacity duration-150 z-10 ${selected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: CTRL, height: CTRL, top: -CTRL_HALF, right: -CTRL_HALF, fontSize: 14, cursor: 'pointer' }}
        aria-label="Delete sticker"
      >×</button>

      {/* SCALE+ — bottom right */}
      <button
        onPointerDown={e => { e.stopPropagation(); onScale(sticker.id, 0.15); }}
        className={`absolute flex items-center justify-center rounded-full bg-[#222] border border-[#444] text-white shadow transition-opacity duration-150 z-10 ${selected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: CTRL, height: CTRL, bottom: -CTRL_HALF, right: -CTRL_HALF, fontSize: 16, lineHeight: 1, cursor: 'pointer' }}
        aria-label="Scale up"
      >+</button>

      {/* SCALE− — bottom left */}
      <button
        onPointerDown={e => { e.stopPropagation(); onScale(sticker.id, -0.15); }}
        className={`absolute flex items-center justify-center rounded-full bg-[#222] border border-[#444] text-white shadow transition-opacity duration-150 z-10 ${selected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: CTRL, height: CTRL, bottom: -CTRL_HALF, left: -CTRL_HALF, fontSize: 16, lineHeight: 1, cursor: 'pointer' }}
        aria-label="Scale down"
      >−</button>

      {/* ROTATE — top left (drag to spin) */}
      <div
        onPointerDown={handleRotateDown}
        onPointerMove={handleRotateMove}
        onPointerUp={handleRotateUp}
        className={`absolute flex items-center justify-center rounded-full bg-[#ffb800] border-2 border-white shadow-lg transition-opacity duration-150 z-10 ${selected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ width: CTRL + 2, height: CTRL + 2, top: -CTRL_HALF, left: -CTRL_HALF, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
        title="Drag to rotate"
      >
        {/* Circular arrow icon */}
        <svg viewBox="0 0 14 14" width={12} height={12} fill="none">
          <path
            d="M2 7a5 5 0 1 1 .9 2.9"
            stroke="#1a1a1a"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <path
            d="M0.5 10.5 L2.2 7.5 L4.5 9.5"
            stroke="#1a1a1a"
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Selection dashed ring */}
      {selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -8,
            border: '1.5px dashed rgba(255,184,0,0.75)',
            borderRadius: 6,
          }}
        />
      )}
    </div>
  );
};