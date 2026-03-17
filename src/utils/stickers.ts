// src/utils/stickers.ts

import type { StickerTemplate } from '../types';

export interface StickerCategory {
  label: string;
  items: StickerTemplate[];
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  {
    label: 'Fun',
    items: [
      { emoji: '🎉', label: 'Party', scale: 1.5, rotation: -10 },
      { emoji: '🥳', label: 'Celebrate', scale: 1.4, rotation: 5 },
      { emoji: '🎊', label: 'Confetti', scale: 1.4, rotation: 15 },
      { emoji: '✨', label: 'Sparkle', scale: 1.2, rotation: 0 },
      { emoji: '🌟', label: 'Star', scale: 1.2, rotation: 20 },
      { emoji: '💥', label: 'Boom', scale: 1.5, rotation: -5 },
      { emoji: '🔥', label: 'Fire', scale: 1.3, rotation: 0 },
      { emoji: '💫', label: 'Dizzy', scale: 1.2, rotation: 10 },
    ],
  },
  {
    label: 'Faces',
    items: [
      { emoji: '😎', label: 'Cool', scale: 1.6, rotation: 0 },
      { emoji: '🤩', label: 'Starstruck', scale: 1.6, rotation: -3 },
      { emoji: '😂', label: 'LOL', scale: 1.5, rotation: 5 },
      { emoji: '🤪', label: 'Zany', scale: 1.5, rotation: -8 },
      { emoji: '😍', label: 'Love', scale: 1.5, rotation: 3 },
      { emoji: '🥸', label: 'Disguise', scale: 1.6, rotation: 0 },
      { emoji: '🤓', label: 'Nerd', scale: 1.6, rotation: 2 },
      { emoji: '👑', label: 'Crown', scale: 1.4, rotation: 0 },
    ],
  },
  {
    label: 'Props',
    items: [
      { emoji: '🕶️', label: 'Shades', scale: 1.8, rotation: 0 },
      { emoji: '🎩', label: 'Top hat', scale: 1.5, rotation: -5 },
      { emoji: '🪄', label: 'Magic', scale: 1.4, rotation: 30 },
      { emoji: '🎸', label: 'Guitar', scale: 1.6, rotation: -15 },
      { emoji: '🌈', label: 'Rainbow', scale: 1.5, rotation: 0 },
      { emoji: '💎', label: 'Diamond', scale: 1.3, rotation: 5 },
      { emoji: '🎭', label: 'Drama', scale: 1.4, rotation: -5 },
      { emoji: '📸', label: 'Camera', scale: 1.3, rotation: 0 },
    ],
  },
  {
    label: 'Love',
    items: [
      { emoji: '❤️', label: 'Heart', scale: 1.4, rotation: 0 },
      { emoji: '💕', label: 'Hearts', scale: 1.4, rotation: 5 },
      { emoji: '💖', label: 'Sparkle heart', scale: 1.4, rotation: -3 },
      { emoji: '🫶', label: 'Love', scale: 1.5, rotation: 0 },
      { emoji: '💌', label: 'Letter', scale: 1.3, rotation: 10 },
      { emoji: '🌹', label: 'Rose', scale: 1.3, rotation: -10 },
      { emoji: '🦋', label: 'Butterfly', scale: 1.4, rotation: 5 },
      { emoji: '🌸', label: 'Blossom', scale: 1.3, rotation: 0 },
    ],
  },
];

export const ALL_STICKERS = STICKER_CATEGORIES.flatMap(c => c.items);
