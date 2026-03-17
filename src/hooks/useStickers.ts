// src/hooks/useStickers.ts

import { useState, useCallback } from 'react';
import type { Sticker, StickerTemplate } from '../types';
import { generateId } from '../utils/photoUtils';

export function useStickers() {
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const addSticker = useCallback((template: StickerTemplate) => {
    const sticker: Sticker = {
      ...template,
      id: generateId(),
      x: 0.3 + Math.random() * 0.4,
      y: 0.25 + Math.random() * 0.5,
    };
    setStickers(prev => [...prev, sticker]);
  }, []);

  const moveSticker = useCallback((id: string, x: number, y: number) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
  }, []);

  const deleteSticker = useCallback((id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  }, []);

  const scaleSticker = useCallback((id: string, delta: number) => {
    setStickers(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, scale: Math.max(0.4, Math.min(4, s.scale + delta)) }
          : s
      )
    );
  }, []);

  /** Set absolute rotation in degrees (free spin, no clamping) */
  const rotateSticker = useCallback((id: string, deg: number) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, rotation: deg } : s));
  }, []);

  const clearStickers = useCallback(() => setStickers([]), []);

  return {
    stickers,
    addSticker,
    moveSticker,
    deleteSticker,
    scaleSticker,
    rotateSticker,
    clearStickers,
  };
}