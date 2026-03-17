// src/components/StickerPicker.tsx

import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { STICKER_CATEGORIES } from '../utils/stickers';
import type { StickerTemplate } from '../types';

interface Props {
  onAdd: (template: StickerTemplate) => void;
  onClearAll: () => void;
  stickerCount: number;
  onClose: () => void;
}

export const StickerPicker: React.FC<Props> = ({ onAdd, onClearAll, stickerCount, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up bg-booth-panel border-t border-booth-border rounded-t-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-8 h-1 rounded-full bg-booth-dim" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-booth-text tracking-wide">STICKERS</span>
          {stickerCount > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-booth-border text-booth-muted hover:text-booth-accent font-mono text-[9px] uppercase tracking-wider transition-colors"
            >
              <Trash2 size={9} /> Clear {stickerCount}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-booth-border text-booth-muted hover:text-booth-text transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0 border-b border-booth-border px-4 overflow-x-auto scrollbar-hide">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(i)}
            className={`
              shrink-0 px-3 py-2 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-all
              ${activeCategory === i
                ? 'border-booth-accent text-booth-accent'
                : 'border-transparent text-booth-muted hover:text-booth-text'
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Sticker grid — responsive cols */}
      <div className="grid grid-cols-8 gap-1 p-3 pb-4">
        {STICKER_CATEGORIES[activeCategory].items.map((sticker) => (
          <button
            key={sticker.label}
            onClick={() => { onAdd(sticker); onClose(); }}
            className="flex items-center justify-center h-10 rounded-lg hover:bg-booth-border active:scale-90 transition-all"
            title={sticker.label}
          >
            <span style={{ fontSize: '22px', lineHeight: 1 }}>{sticker.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
