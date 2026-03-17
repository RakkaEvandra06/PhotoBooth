// src/utils/filters.ts

import type { FilterConfig, FilterType } from '../types';

export const FILTERS: FilterConfig[] = [
  {
    id: 'none',
    label: 'Normal',
    cssFilter: '',
  },
  {
    id: 'grayscale',
    label: 'B&W',
    cssFilter: 'grayscale(100%)',
    canvasTransform: (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    cssFilter: 'sepia(100%)',
    canvasTransform: (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'vintage',
    label: 'Vintage',
    cssFilter: 'sepia(60%) contrast(1.1) brightness(0.9) saturate(1.4)',
    canvasTransform: (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        // Sepia-ish warm tint
        data[i]     = Math.min(255, r * 0.5 + g * 0.4 + b * 0.1 + 30);
        data[i + 1] = Math.min(255, r * 0.35 + g * 0.45 + b * 0.1 + 10);
        data[i + 2] = Math.min(255, r * 0.1 + g * 0.1 + b * 0.4);
      }
      ctx.putImageData(imageData, 0, 0);
      // Vignette overlay
      const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    },
  },
  {
    id: 'contrast',
    label: 'Punch',
    cssFilter: 'contrast(1.6) saturate(1.4) brightness(1.05)',
    canvasTransform: (ctx, w, h) => {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const factor = 1.6;
      const intercept = 128 * (1 - factor);
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = Math.min(255, Math.max(0, data[i] * factor + intercept));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
      }
      ctx.putImageData(imageData, 0, 0);
    },
  },
  {
    id: 'mirror',
    label: 'Mirror',
    cssFilter: 'scaleX(-1)',
  },
];

export function getCssFilter(filter: FilterType, isMirror: boolean): string {
  if (filter === 'mirror') {
    return '';
  }
  const def = FILTERS.find(f => f.id === filter);
  const filterStr = def?.cssFilter ?? '';
  const mirrorStr = isMirror ? 'scaleX(-1)' : '';
  // CSS filter and transform are separate properties
  return filterStr;
}

export function getCssTransform(filter: FilterType, isMirror: boolean): string {
  const parts: string[] = [];
  if (isMirror || filter === 'mirror') parts.push('scaleX(-1)');
  return parts.join(' ');
}
