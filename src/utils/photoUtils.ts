// src/utils/photoUtils.ts

import type { FilterType, Photo, PhotoStrip } from '../types';
import { FILTERS } from './filters';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function captureFrame(
  video: HTMLVideoElement,
  filter: FilterType,
  isMirror: boolean,
): Photo {
  const canvas = document.createElement('canvas');
  const w = video.videoWidth  || 640;
  const h = video.videoHeight || 480;

  canvas.width  = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;

  if (isMirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  applyCanvasFilter(ctx, filter, w, h);

  return {
    id: generateId(),
    dataUrl: canvas.toDataURL('image/png'),
    filter,
    timestamp: Date.now(),
    isMirror,
    width: w,
    height: h,
  };
}

function applyCanvasFilter(
  ctx: CanvasRenderingContext2D,
  filter: FilterType,
  w: number,
  h: number
): void {
  const filterDef = FILTERS.find(f => f.id === filter);
  if (!filterDef?.canvasTransform) return;
  filterDef.canvasTransform(ctx, w, h);
}

/**
 * loadImage — wraps new Image() in a Promise so we can await it.
 * This is the core fix for the "4th photo missing" bug:
 * the original code used new Image() + drawImage synchronously
 * without waiting for the image to load, so the last frame was
 * often blank on slower devices.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * drawRoundRect — draws a rounded rectangle path.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function buildPhotoStrip(
  photos: Photo[],
  templateId = 'classic'
): Promise<PhotoStrip> {
  const { STRIP_TEMPLATES } = await import('./StripTemplates');
  const template = STRIP_TEMPLATES.find(t => t.id === templateId) ?? STRIP_TEMPLATES[0];
  const dataUrl = await template.render(photos);

  return {
    id: generateId(),
    dataUrl,
    photos,
    timestamp: Date.now(),
    templateId: template.id,
  };
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}