// src/utils/StripTemplates.ts
// 20 photo strip templates — 2x6 format (4 photos per strip)
// Brand: LumiSnap · Date printed on every strip

import type { Photo, StripTemplate } from '../types';
import { loadImage, drawRoundRect, generateId } from './photoUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STRIP_W = 420;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Layout {
  PAD: number;
  GAP: number;
  HEADER: number;
  FOOTER: number;
  RADIUS: number;
  photoW: number;
  photoH: number;
  totalH: number;
}

type RenderFn = (photos: Photo[]) => Promise<string>;

// ─── Core Utilities ───────────────────────────────────────────────────────────

/** Load all photos as HTMLImageElements in parallel — guaranteed order */
const loadAllPhotos = (photos: Photo[]): Promise<HTMLImageElement[]> =>
  Promise.all(photos.map((p) => loadImage(p.dataUrl)));

const makeCanvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')!];
};

/** Standard 2x6 layout: 4 photos stacked vertically */
const getLayout = (photos: Photo[]): Layout => {
  const PAD = 14, GAP = 8, HEADER = 56, FOOTER = 48, RADIUS = 6;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;
  return { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH };
};

const getTimestamp = (photos: Photo[]): number => photos[0]?.timestamp ?? Date.now();

const formatDate = (timestamp: number, options?: Intl.DateTimeFormatOptions): string =>
  new Date(timestamp).toLocaleDateString('en-GB', options ?? { day: '2-digit', month: 'short', year: 'numeric' });

/** Shared footer: LumiSnap brand + date */
const drawBrandFooter = (
  ctx: CanvasRenderingContext2D,
  totalH: number,
  FOOTER: number,
  bgColor: string,
  textColor: string,
  accentColor: string,
  timestamp: number
): void => {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.font = 'bold 15px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = accentColor;
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '10px monospace';
  ctx.fillStyle = textColor;
  ctx.fillText(formatDate(timestamp), STRIP_W / 2, totalH - FOOTER + 38);
};

/** Draw a scatter of small symbols across the canvas */
const drawScatter = (
  ctx: CanvasRenderingContext2D,
  symbols: string[],
  colors: string[],
  count: number,
  totalH: number,
  alpha = 1
): void => {
  ctx.globalAlpha = alpha;
  for (let d = 0; d < count; d++) {
    const dx = 15 + (d * 73) % (STRIP_W - 30);
    const dy = 15 + (d * 137) % (totalH - 30);
    ctx.font = `${12 + (d % 4) * 5}px serif`;
    ctx.fillStyle = colors[d % colors.length];
    ctx.textAlign = 'center';
    ctx.fillText(symbols[d % symbols.length], dx, dy);
  }
  ctx.globalAlpha = 1;
};

/** Apply B&W conversion to a region of the canvas */
const applyGrayscale = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  const id = ctx.getImageData(x, y, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = gray;
  }
  ctx.putImageData(id, x, y);
};

/** Apply sepia conversion to a region of the canvas */
const applySepia = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  const id = ctx.getImageData(x, y, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }
  ctx.putImageData(id, x, y);
};

/** Add film grain noise over a photo region */
const addGrain = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, count = 800): void => {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 1, 1);
  }
};

/** Draw a radial vignette over a photo */
const drawVignette = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color = 'rgba(0,0,0,0.35)'
): void => {
  const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.25, x + w / 2, y + h / 2, h * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, color);
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
};

/** Draw and clip a photo with optional rounded corners */
const drawPhoto = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
  radius = 6,
  overlay?: string
): void => {
  ctx.save();
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, w, h);
  if (overlay) {
    ctx.fillStyle = overlay;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
};

// ─── 🌸 AESTHETIC & CUTE ─────────────────────────────────────────────────────

// 1. Coquette Pink
const renderCoquette: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, '#fce4ec');
  bg.addColorStop(0.5, '#fff0f3');
  bg.addColorStop(1, '#fce4ec');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Lace dot pattern
  for (let lx = 0; lx < STRIP_W; lx += 12) {
    for (let ly = 0; ly < totalH; ly += 12) {
      ctx.beginPath();
      ctx.arc(lx, ly, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(233,30,99,0.06)';
      ctx.fill();
    }
  }

  // Header
  ctx.fillStyle = '#f48fb1';
  ctx.fillRect(0, 0, STRIP_W, HEADER);

  const drawRibbonLines = (yOffset: number) => {
    ctx.strokeStyle = '#ec407a';
    ctx.lineWidth = 1;
    [yOffset - 6, yOffset - 2].forEach((ly) => {
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(STRIP_W, ly); ctx.stroke();
    });
  };
  drawRibbonLines(HEADER);

  ctx.font = '18px serif';
  ctx.fillStyle = '#e91e63';
  ctx.textAlign = 'left'; ctx.fillText('🎀', 14, 36);
  ctx.textAlign = 'right'; ctx.fillText('🎀', STRIP_W - 14, 36);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px "Bebas Neue", serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 30);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('coquette edition ♡', STRIP_W / 2, 46);

  const borderCols = ['#f48fb1', '#f06292', '#ec407a', '#f48fb1'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.shadowColor = borderCols[i];
    ctx.shadowBlur = 10;
    ctx.strokeStyle = borderCols[i];
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 4);
    ctx.stroke();
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.fillStyle = 'rgba(244,143,177,0.07)';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  drawBrandFooter(ctx, totalH, FOOTER, '#f48fb1', 'rgba(255,255,255,0.75)', '#fff', getTimestamp(photos));
  drawRibbonLines(totalH - FOOTER + 8);

  return canvas.toDataURL('image/png');
};

// 2. Pastel Kawaii
const renderPastelKawaii: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, STRIP_W, totalH);
  [0, 0.25, 0.5, 0.75, 1].forEach((stop, i) => {
    bg.addColorStop(stop, ['#fff9fb', '#fff3fb', '#f3fbff', '#f3fff6', '#fffbf0'][i]);
  });
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  drawScatter(
    ctx,
    ['✦', '✿', '♡', '☁', '✩', '◦'],
    ['#ffb3d9', '#b3d9ff', '#b3ffde', '#ffd9b3', '#d9b3ff'],
    28, totalH
  );

  // Header pill
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(8, 6, STRIP_W - 16, HEADER - 10, 28);
  const hg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  hg.addColorStop(0, '#ffd6e8');
  hg.addColorStop(0.5, '#c5e8ff');
  hg.addColorStop(1, '#d4f5e0');
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#d946a8';
  ctx.font = 'bold 20px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('♡ LUMISNAP ♡', STRIP_W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#9c69c4';
  ctx.fillText('kawaii memories ˙˚₊✧', STRIP_W / 2, 44);

  const borderGrads = [
    ['#ffb3d9', '#b3d9ff'], ['#b3d9ff', '#b3ffde'],
    ['#b3ffde', '#ffd9b3'], ['#ffd9b3', '#d9b3ff'],
  ] as const;

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    const grad = ctx.createLinearGradient(PAD, y, PAD + photoW, y + photoH);
    grad.addColorStop(0, borderGrads[i][0]);
    grad.addColorStop(1, borderGrads[i][1]);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 6);
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.restore();
    ctx.font = '14px serif';
    ctx.fillStyle = borderGrads[i][0];
    ctx.textAlign = 'left'; ctx.fillText('✿', PAD + 5, y + 18);
    ctx.textAlign = 'right'; ctx.fillText('♡', PAD + photoW - 5, y + 18);
    y += photoH + GAP;
  }

  // Footer pill
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(8, totalH - FOOTER + 4, STRIP_W - 16, FOOTER - 8, 20);
  const fg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  fg.addColorStop(0, '#ffd6e8'); fg.addColorStop(0.5, '#c5e8ff'); fg.addColorStop(1, '#d4f5e0');
  ctx.fillStyle = fg;
  ctx.fill();
  ctx.restore();

  ctx.font = 'bold 13px "Bebas Neue", sans-serif';
  ctx.fillStyle = '#d946a8';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#9c69c4';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 3. Korean Minimal
const renderKoreanMinimal: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  ctx.strokeStyle = '#e8e0d8';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(0.5, 0.5, STRIP_W - 1, totalH - 1);
  [[10, 0, 10, totalH], [STRIP_W - 10, 0, STRIP_W - 10, totalH]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });

  ctx.fillStyle = '#f9f6f2';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = '#e8e0d8';
  ctx.beginPath(); ctx.moveTo(0, HEADER); ctx.lineTo(STRIP_W, HEADER); ctx.stroke();

  ctx.fillStyle = '#c9a882';
  ctx.fillRect(STRIP_W / 2 - 28, 0, 56, 2);
  ctx.fillRect(STRIP_W / 2 - 28, totalH - 2, 56, 2);

  ctx.fillStyle = '#3d2b1f';
  ctx.font = '200 20px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.font = '300 9px monospace';
  ctx.fillStyle = '#c9a882';
  ctx.letterSpacing = '3px';
  ctx.fillText('photo studio', STRIP_W / 2, 44);

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    drawPhoto(ctx, imgs[i], PAD, y, photoW, photoH, 2);
    const fade = ctx.createLinearGradient(0, y + photoH - 20, 0, y + photoH);
    fade.addColorStop(0, 'rgba(255,255,255,0)');
    fade.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = fade;
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.font = '300 9px monospace';
    ctx.fillStyle = '#c9a882';
    ctx.textAlign = 'right';
    ctx.fillText(`0${i + 1}`, PAD + photoW - 6, y + 14);
    y += photoH + GAP;
  }

  ctx.fillStyle = '#f9f6f2';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.strokeStyle = '#e8e0d8';
  ctx.beginPath(); ctx.moveTo(0, totalH - FOOTER); ctx.lineTo(STRIP_W, totalH - FOOTER); ctx.stroke();

  ctx.fillStyle = '#3d2b1f';
  ctx.font = '300 11px "DM Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '300 9px monospace';
  ctx.fillStyle = '#c9a882';
  ctx.letterSpacing = '2px';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 4. Soft Blush Aesthetic
const renderSoftBlush: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, STRIP_W, totalH);
  bg.addColorStop(0, '#fdeef0'); bg.addColorStop(0.4, '#fdf6f0'); bg.addColorStop(1, '#f9eef5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  const glowPositions = [[60, 0.15], [STRIP_W - 60, 0.3], [80, 0.7], [STRIP_W - 80, 0.85]] as const;
  glowPositions.forEach(([gx, gy]) => {
    const rad = ctx.createRadialGradient(gx, totalH * gy, 0, gx, totalH * gy, 80);
    rad.addColorStop(0, 'rgba(255,182,193,0.2)');
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.beginPath(); ctx.arc(gx, totalH * gy, 80, 0, Math.PI * 2); ctx.fill();
  });

  // Arch header
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(STRIP_W, 0);
  ctx.lineTo(STRIP_W, HEADER - 8);
  ctx.quadraticCurveTo(STRIP_W / 2, HEADER + 10, 0, HEADER - 8);
  ctx.closePath();
  ctx.fillStyle = '#f8b4c8';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px "Bebas Neue", serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ LUMISNAP ✦', STRIP_W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('soft blush · natural glow', STRIP_W / 2, 44);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(248,180,200,0.5)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(248,180,200,0.6)';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 8);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.fillStyle = 'rgba(255,182,193,0.06)';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  // Arch footer
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, totalH - FOOTER + 8);
  ctx.quadraticCurveTo(STRIP_W / 2, totalH - FOOTER - 10, STRIP_W, totalH - FOOTER + 8);
  ctx.lineTo(STRIP_W, totalH); ctx.lineTo(0, totalH);
  ctx.closePath();
  ctx.fillStyle = '#f8b4c8';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Bebas Neue", serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 24);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 40);

  return canvas.toDataURL('image/png');
};

// 5. Milk Aesthetic
const renderMilkAesthetic: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let tx = 0; tx < STRIP_W; tx += 4) {
    for (let ty = 0; ty < totalH; ty += 4) {
      if ((tx + ty) % 8 === 0) {
        ctx.fillStyle = 'rgba(210,190,160,0.03)';
        ctx.fillRect(tx, ty, 2, 2);
      }
    }
  }

  ctx.fillStyle = '#ede8df';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = '#d4c9b8'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, HEADER); ctx.lineTo(STRIP_W, HEADER); ctx.stroke();

  ctx.fillStyle = '#c8b89a';
  ctx.fillRect(STRIP_W / 2 - 40, 8, 80, 1);
  ctx.fillRect(STRIP_W / 2 - 40, HEADER - 8, 80, 1);

  ctx.fillStyle = '#7a6552';
  ctx.font = '300 18px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '5px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 30);
  ctx.font = '300 9px monospace';
  ctx.fillStyle = '#c8b89a';
  ctx.letterSpacing = '2px';
  ctx.fillText('milk aesthetic · pure + simple', STRIP_W / 2, 46);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.fillStyle = '#f0ebe2';
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    drawRoundRect(ctx, PAD - 4, y - 4, photoW + 8, photoH + 8, RADIUS + 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.fillStyle = 'rgba(250,248,244,0.08)';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  ctx.fillStyle = '#ede8df';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.strokeStyle = '#d4c9b8'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, totalH - FOOTER); ctx.lineTo(STRIP_W, totalH - FOOTER); ctx.stroke();
  ctx.fillStyle = '#c8b89a';
  ctx.fillRect(STRIP_W / 2 - 40, totalH - FOOTER + 1, 80, 0.5);

  ctx.fillStyle = '#7a6552';
  ctx.font = '300 13px "DM Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '300 9px monospace';
  ctx.fillStyle = '#c8b89a';
  ctx.letterSpacing = '2px';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// ─── 🎞️ VINTAGE & RETRO ──────────────────────────────────────────────────────

// 6. Film Camera Strip
const renderFilmStrip: RenderFn = async (photos) => {
  const SPROCKET = 22, PAD = 8, GAP = 4, HEADER = 48, FOOTER = 48;
  const photoW = STRIP_W - SPROCKET * 2 - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#0e0c08';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  ctx.fillStyle = '#1a1610';
  ctx.fillRect(0, 0, SPROCKET, totalH);
  ctx.fillRect(STRIP_W - SPROCKET, 0, SPROCKET, totalH);

  const drawSprocketHoles = () => {
    for (let sy = HEADER + 20; sy < totalH - FOOTER - 20; sy += 36) {
      [4, STRIP_W - 4 - 12].forEach((hx) => {
        ctx.fillStyle = '#000'; ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.roundRect(hx, sy, 12, 18, 2); ctx.fill(); ctx.stroke();
      });
    }
  };
  drawSprocketHoles();

  ctx.fillStyle = '#4a3f28';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  for (let m = 1; m <= photos.length; m++) {
    const my = HEADER + PAD + (m - 1) * (photoH + GAP) + photoH / 2;
    [[9, -Math.PI / 2], [STRIP_W - 9, Math.PI / 2]].forEach(([tx, rot]) => {
      ctx.save();
      ctx.translate(tx as number, my);
      ctx.rotate(rot as number);
      ctx.fillText(`LUMISNAP ${m}`, 0, 0);
      ctx.restore();
    });
  }

  ctx.fillStyle = '#f5e0a0';
  ctx.font = 'bold 22px "Bebas Neue", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.fillStyle = '#a89060';
  ctx.font = '9px monospace';
  ctx.fillText('ANALOG FILM · 35mm FORMAT', STRIP_W / 2, 42);

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.drawImage(imgs[i], SPROCKET + PAD, y, photoW, photoH);
    addGrain(ctx, SPROCKET + PAD, y, photoW, photoH);
    const ll = ctx.createLinearGradient(0, y, 0, y + photoH * 0.2);
    ll.addColorStop(0, 'rgba(255,200,80,0.1)'); ll.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = ll;
    ctx.fillRect(SPROCKET + PAD, y, photoW, photoH);
    ctx.fillStyle = '#f5e0a0';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${i + 1}A`, SPROCKET + PAD + photoW - 4, y + photoH - 4);
    y += photoH + GAP;
  }

  ctx.fillStyle = '#f5e0a0';
  ctx.font = 'bold 14px "Bebas Neue", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP PHOTOBOOTH', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.fillStyle = '#a89060';
  ctx.font = '9px monospace';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 7. Black & White Vintage
const renderBWVintage: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#f0ebe0';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  addGrain(ctx, 0, 0, STRIP_W, totalH, 4000);

  const drawBWBand = (y: number, h: number) => {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, y, STRIP_W, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
    ctx.strokeRect(5, y + 4, STRIP_W - 10, h - 8);
    ctx.strokeRect(8, y + 7, STRIP_W - 16, h - 14);
  };

  drawBWBand(0, HEADER);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold italic 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 30);
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText('PHOTOGRAPHIC STUDIO', STRIP_W / 2, 46);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(PAD - 2, y - 2, photoW + 4, photoH + 4);
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    applyGrayscale(ctx, PAD, y, photoW, photoH);
    addGrain(ctx, PAD, y, photoW, photoH, 600);
    ctx.restore();
    y += photoH + GAP;
  }

  drawBWBand(totalH - FOOTER, FOOTER);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Bebas Neue", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.fillStyle = '#aaa';
  ctx.font = '9px monospace';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 8. Sepia Photobooth
const renderSepiaBooth: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, '#f2e0c0'); bg.addColorStop(0.5, '#f5e8cc'); bg.addColorStop(1, '#edd8b0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let g = 0; g < 3000; g++) {
    ctx.fillStyle = `rgba(${140 + Math.random() * 40},${100 + Math.random() * 40},${50 + Math.random() * 30},${Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * STRIP_W, Math.random() * totalH, 1, 1);
  }

  [[0, 0, 30, 0], [STRIP_W - 30, 0, STRIP_W, 0]].forEach(([x1, _, x2, __], i) => {
    const fade = ctx.createLinearGradient(i === 0 ? 0 : STRIP_W - 30, 0, i === 0 ? 30 : STRIP_W, 0);
    fade.addColorStop(i === 0 ? 0 : 1, 'rgba(100,60,20,0.15)');
    fade.addColorStop(i === 0 ? 1 : 0, 'transparent');
    ctx.fillStyle = fade;
    ctx.fillRect(i === 0 ? 0 : STRIP_W - 30, 0, 30, totalH);
  });

  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, STRIP_W - 12, HEADER - 12);

  ctx.fillStyle = '#f5e0a0';
  ctx.font = 'bold italic 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillStyle = '#c8a060';
  ctx.fillText('ANTIQUE PHOTOBOOTH · WARM MEMORIES', STRIP_W / 2, 46);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(80,40,10,0.4)';
    ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    applySepia(ctx, PAD, y, photoW, photoH);
    drawVignette(ctx, PAD, y, photoW, photoH, 'rgba(80,40,10,0.35)');
    ctx.restore();
    y += photoH + GAP;
  }

  drawBrandFooter(ctx, totalH, FOOTER, '#5c3a1e', '#c8a060', '#f5e0a0', getTimestamp(photos));
  ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 1;
  ctx.strokeRect(6, totalH - FOOTER + 6, STRIP_W - 12, FOOTER - 12);

  return canvas.toDataURL('image/png');
};

// 9. Polaroid Strip Style
const renderPolaroidStrip: RenderFn = async (photos) => {
  const FRAME = 16, BOTTOM = 52, GAP = 18, TOP_PAD = 24, BOT_PAD = 20;
  const photoW = STRIP_W - FRAME * 2 - 28;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const cardH = FRAME + photoH + BOTTOM;
  const totalH = TOP_PAD + photos.length * cardH + (photos.length - 1) * GAP + BOT_PAD;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  for (let lx = 0; lx < STRIP_W; lx += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.015)';
    ctx.fillRect(lx, 0, 1, totalH);
  }

  const tiltAngles = [-2.8, 1.6, -1.2, 2.2];
  let y = TOP_PAD;

  imgs.forEach((img, i) => {
    const ang = tiltAngles[i % tiltAngles.length] * Math.PI / 180;
    const cx = STRIP_W / 2, cy = y + cardH / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);

    ctx.shadowColor = 'rgba(0,0,0,0.16)';
    ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-photoW / 2 - FRAME, -cardH / 2, photoW + FRAME * 2, cardH);
    ctx.shadowBlur = 0;

    ctx.drawImage(img, -photoW / 2, -cardH / 2 + FRAME, photoW, photoH);

    ctx.fillStyle = '#fff';
    ctx.fillRect(-photoW / 2 - FRAME, -cardH / 2 + FRAME + photoH, photoW + FRAME * 2, BOTTOM);

    ctx.fillStyle = '#7a6a5a';
    ctx.font = '300 12px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      new Date(photos[i]?.timestamp ?? Date.now()).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      0, -cardH / 2 + FRAME + photoH + 24
    );
    ctx.fillStyle = '#c8b89a';
    ctx.font = '300 9px monospace';
    ctx.fillText('LUMISNAP', 0, -cardH / 2 + FRAME + photoH + 40);
    ctx.restore();
    y += cardH + GAP;
  });

  return canvas.toDataURL('image/png');
};

// 10. 90s Retro Vibe
const renderRetro90s: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#00bcd4';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let gx = 0; gx < STRIP_W; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, totalH); ctx.stroke();
  }
  for (let gy = 0; gy < totalH; gy += 20) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(STRIP_W, gy); ctx.stroke();
  }

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, totalH * 0.3); ctx.lineTo(STRIP_W, totalH * 0.15);
  ctx.lineTo(STRIP_W, totalH * 0.25); ctx.lineTo(0, totalH * 0.42);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  const drawZigzag = (yPos: number, fill: string) => {
    ctx.fillStyle = fill;
    for (let zx = 0; zx < STRIP_W; zx += 10) {
      ctx.beginPath();
      ctx.moveTo(zx, yPos); ctx.lineTo(zx + 5, yPos - 8); ctx.lineTo(zx + 10, yPos);
      ctx.fill();
    }
  };

  ctx.fillStyle = '#ff4081';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  drawZigzag(HEADER, '#ffeb3b');

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff4081'; ctx.shadowBlur = 8;
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffeb3b';
  ctx.font = 'bold 11px "Bebas Neue", sans-serif';
  ctx.fillText('90S RETRO VIBE ★', STRIP_W / 2, 44);

  const border90s = ['#ff4081', '#ffeb3b', '#00e5ff', '#76ff03'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.strokeStyle = border90s[i % border90s.length];
    ctx.lineWidth = 3;
    drawRoundRect(ctx, PAD, y, photoW, photoH, 0);
    ctx.stroke(); ctx.clip();
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    addGrain(ctx, PAD, y, photoW, photoH, 1200);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    ctx.fillStyle = border90s[i % border90s.length];
    ctx.font = 'bold 20px "Bebas Neue", Impact, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`0${i + 1}`, PAD + photoW - 8, y + photoH - 6);
    y += photoH + GAP;
  }

  ctx.fillStyle = '#ff4081';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  drawZigzag(totalH - FOOTER, '#ffeb3b');

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 24);
  ctx.fillStyle = '#ffeb3b';
  ctx.font = '9px monospace';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// ─── ✨ ELEGANT & EVENT ───────────────────────────────────────────────────────

// 11. Floral Wedding
const renderFloralWedding: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#fdfaf6';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let v = 0; v < 6; v++) {
    ctx.fillStyle = `rgba(168,197,160,${0.06 + v * 0.02})`;
    [8, STRIP_W - 8].forEach((cx, ci) => {
      ctx.beginPath();
      ctx.arc(cx, (totalH / 5) * (v + (ci === 0 ? 0.5 : 0.8)), 30 + v * (ci === 0 ? 8 : 6), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const flowerEmojis = ['🌸', '🌿', '🌺', '🍃'];
  ctx.font = '18px serif';
  [[8, 22], [STRIP_W - 30, 22], [6, HEADER / 2 + 12], [STRIP_W - 30, HEADER / 2 + 12],
   [8, totalH - FOOTER - 10], [STRIP_W - 30, totalH - FOOTER - 10]].forEach(([fx, fy], fi) => {
    ctx.textAlign = 'left';
    ctx.fillText(flowerEmojis[fi % flowerEmojis.length], fx, fy);
  });

  ctx.fillStyle = '#f3ede4';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = '#c9a882'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, HEADER); ctx.lineTo(STRIP_W, HEADER); ctx.stroke();

  ctx.fillStyle = '#7a5c3c';
  ctx.font = '300 18px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '5px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 26);
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillStyle = '#c9a882';
  ctx.letterSpacing = '2px';
  ctx.fillText('floral wedding studio', STRIP_W / 2, 44);

  ctx.strokeStyle = '#c9a882'; ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(8, 8, STRIP_W - 16, HEADER - 16);
  ctx.setLineDash([]);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(180,150,100,0.2)';
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.strokeStyle = '#c9a882'; ctx.lineWidth = 1;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 4);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();
    ctx.font = '14px serif';
    ctx.textAlign = 'left'; ctx.fillText('🌸', PAD + 4, y + 18);
    ctx.textAlign = 'right'; ctx.fillText('🌿', PAD + photoW - 4, y + 18);
    y += photoH + GAP;
  }

  ctx.fillStyle = '#f3ede4';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.strokeStyle = '#c9a882'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, totalH - FOOTER); ctx.lineTo(STRIP_W, totalH - FOOTER); ctx.stroke();

  ctx.fillStyle = '#7a5c3c';
  ctx.font = '300 13px "DM Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillStyle = '#c9a882';
  ctx.letterSpacing = '1px';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 12. Gold Luxury
const renderGoldLuxury: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#0a0800';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let s = 0; s < 2000; s++) {
    ctx.fillStyle = `rgba(${200 + Math.random() * 55},${170 + Math.random() * 30},${50 + Math.random() * 40},${Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * STRIP_W, Math.random() * totalH, 1, 1);
  }

  const makeGoldGrad = (x1 = 0, y1 = 0, x2 = STRIP_W, y2 = 0) => {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, '#b8960c'); g.addColorStop(0.3, '#f5d020');
    g.addColorStop(0.5, '#ffd700'); g.addColorStop(0.7, '#f5d020');
    g.addColorStop(1, '#b8960c');
    return g;
  };

  ctx.strokeStyle = makeGoldGrad(0, 0, 0, totalH);
  ctx.lineWidth = 1.5; ctx.strokeRect(6, 6, STRIP_W - 12, totalH - 12);
  ctx.lineWidth = 0.5; ctx.strokeRect(10, 10, STRIP_W - 20, totalH - 20);

  const hg = ctx.createLinearGradient(0, 0, STRIP_W, HEADER);
  hg.addColorStop(0, '#1a1200'); hg.addColorStop(0.5, '#2d2000'); hg.addColorStop(1, '#1a1200');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, STRIP_W, HEADER);

  const goldText = makeGoldGrad();
  ctx.fillStyle = goldText;
  ctx.font = 'bold 26px "Bebas Neue", serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 30);
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillStyle = '#c8a040';
  ctx.fillText('GOLD LUXURY EDITION', STRIP_W / 2, 46);

  ctx.strokeStyle = goldText; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(14, HEADER - 1); ctx.lineTo(STRIP_W - 14, HEADER - 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, totalH - FOOTER + 1); ctx.lineTo(STRIP_W - 14, totalH - FOOTER + 1); ctx.stroke();

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.strokeStyle = goldText;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 12;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.fillStyle = 'rgba(255,215,0,0.05)';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    ctx.fillStyle = '#c8a040';
    ctx.font = 'italic 9px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(String.fromCharCode(8544 + i), PAD + photoW - 8, y + 16);
    y += photoH + GAP;
  }

  ctx.fillStyle = goldText;
  ctx.font = 'bold 14px "Bebas Neue", serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.fillStyle = '#c8a040';
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 13. Minimalist Wedding
const renderMinimalistWedding: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  ctx.strokeStyle = '#e8e0d8'; ctx.lineWidth = 0.5;
  ctx.strokeRect(1, 1, STRIP_W - 2, totalH - 2);

  ctx.fillStyle = '#b8a898';
  ctx.fillRect(0, 0, STRIP_W, 2);
  ctx.fillRect(0, totalH - 2, STRIP_W, 2);

  ctx.fillStyle = '#f9f7f5';
  ctx.fillRect(0, 2, STRIP_W, HEADER - 2);
  ctx.strokeStyle = '#e8e0d8'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, HEADER); ctx.lineTo(STRIP_W, HEADER); ctx.stroke();

  ctx.fillStyle = '#5a4a3a';
  ctx.font = '200 16px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 26);

  ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(STRIP_W / 2 - 40, 32); ctx.lineTo(STRIP_W / 2 - 8, 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(STRIP_W / 2 + 8, 32); ctx.lineTo(STRIP_W / 2 + 40, 32); ctx.stroke();
  ctx.beginPath(); ctx.arc(STRIP_W / 2, 32, 3, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#b8a898';
  ctx.font = '300 9px monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText('wedding photobooth', STRIP_W / 2, 46);

  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.strokeStyle = '#e8e0d8'; ctx.lineWidth = 0.5;
    drawRoundRect(ctx, PAD, y, photoW, photoH, 2);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  ctx.fillStyle = '#f9f7f5';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER - 2);
  ctx.strokeStyle = '#e8e0d8'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, totalH - FOOTER); ctx.lineTo(STRIP_W, totalH - FOOTER); ctx.stroke();

  ctx.fillStyle = '#5a4a3a';
  ctx.font = '300 11px "DM Sans", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.fillStyle = '#b8a898';
  ctx.font = '300 9px monospace';
  ctx.letterSpacing = '2px';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 14. Birthday Glitter
const renderBirthdayGlitter: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const SPARKLE_COLORS = ['#ffd700', '#ff69b4', '#00ffcc', '#ff3c3c', '#ffffff', '#ffb800'] as const;

  const bg = ctx.createLinearGradient(0, 0, STRIP_W, totalH);
  bg.addColorStop(0, '#1a0033'); bg.addColorStop(0.4, '#2d0052');
  bg.addColorStop(0.7, '#1a0040'); bg.addColorStop(1, '#0d0020');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Glitter particles
  for (let s = 0; s < 300; s++) {
    ctx.beginPath();
    ctx.arc(Math.random() * STRIP_W, Math.random() * totalH, 0.5 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Confetti
  for (let c = 0; c < 60; c++) {
    ctx.save();
    ctx.fillStyle = SPARKLE_COLORS[c % SPARKLE_COLORS.length];
    ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    ctx.translate(Math.random() * STRIP_W, Math.random() * totalH);
    ctx.rotate(Math.random() * Math.PI * 2);
    if      (c % 3 === 0) ctx.fillRect(-4, -2, 8, 4);
    else if (c % 3 === 1) { ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); }
    else                  { ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, 4); ctx.lineTo(-4, 4); ctx.fill(); }
    ctx.restore();
  }

  // Starburst header
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let sp = 0; sp < 14; sp++) {
    const ang = (sp * Math.PI * 2) / 14 - Math.PI / 2;
    const rd = sp % 2 === 0 ? STRIP_W / 2 + 16 : STRIP_W / 2 * 0.7;
    ctx.lineTo(STRIP_W / 2 + Math.cos(ang) * rd, HEADER / 2 + Math.sin(ang) * rd);
  }
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#1a0033';
  ctx.font = 'bold 26px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.font = 'bold 11px "Bebas Neue", sans-serif';
  ctx.fillText('🎂 BIRTHDAY EDITION 🎂', STRIP_W / 2, 44);

  const glitterBorders = ['#ffd700', '#ff69b4', '#00ffcc', '#ff3c3c'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.shadowColor = glitterBorders[i % glitterBorders.length];
    ctx.shadowBlur = 18;
    ctx.strokeStyle = glitterBorders[i % glitterBorders.length];
    ctx.lineWidth = 2.5;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 4);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    // Glitter overlay
    for (let gs = 0; gs < 200; gs++) {
      ctx.fillStyle = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
      ctx.globalAlpha = Math.random() * 0.05;
      ctx.beginPath();
      ctx.arc(PAD + Math.random() * photoW, y + Math.random() * photoH, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.font = '16px serif';
    ctx.textAlign = 'right';
    ctx.fillText(['🎉', '🥳', '✨', '🎊'][i % 4], PAD + photoW - 6, y + 22);
    y += photoH + GAP;
  }

  drawBrandFooter(ctx, totalH, FOOTER, '#ffd700', '#1a0033', '#1a0033', getTimestamp(photos));

  return canvas.toDataURL('image/png');
};

// 15. Boho Style
const renderBoho: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, '#f5ede0'); bg.addColorStop(0.5, '#f0e4d0'); bg.addColorStop(1, '#e8d8c0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let tx = 0; tx < STRIP_W; tx += 3) {
    for (let ty = 0; ty < totalH; ty += 3) {
      if ((tx + ty) % 6 === 0) {
        ctx.fillStyle = 'rgba(160,120,80,0.04)';
        ctx.fillRect(tx, ty, 2, 1);
      }
    }
  }

  const bohoColors = ['#c8855a', '#d4a06a', '#b86a48', '#c89060'];
  const STRIPE_H = 16;

  const drawBohoStripes = (startY: number) => {
    bohoColors.forEach((color, s) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, startY + s * (STRIPE_H / 4), STRIP_W, STRIPE_H / 4 + 1);
    });
  };

  drawBohoStripes(0);

  ctx.fillStyle = '#5c3820';
  ctx.fillRect(0, STRIPE_H, STRIP_W, HEADER - STRIPE_H);
  ctx.strokeStyle = '#c8855a'; ctx.lineWidth = 1;
  ctx.strokeRect(8, STRIPE_H + 4, STRIP_W - 16, HEADER - STRIPE_H - 8);

  ctx.font = '20px serif';
  ctx.textAlign = 'left'; ctx.fillText('🌙', 16, HEADER - 6);
  ctx.textAlign = 'right'; ctx.fillText('☀️', STRIP_W - 16, HEADER - 6);

  ctx.fillStyle = '#f5e0c0';
  ctx.font = 'bold italic 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, HEADER / 2 + 6);
  ctx.font = 'italic 10px Georgia, serif';
  ctx.fillStyle = '#c8855a';
  ctx.fillText('boho · earth tones · free spirit', STRIP_W / 2, HEADER - 8);

  const bohoDecos = ['🌾', '🍂', '🌻', '🌿'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.shadowColor = 'rgba(100,60,20,0.2)';
    ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.strokeStyle = '#c8855a'; ctx.lineWidth = 2;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 2);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.fillStyle = 'rgba(180,120,60,0.06)';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    ctx.font = '12px serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c8855a';
    ctx.fillText(bohoDecos[i % bohoDecos.length], PAD + 5, y + 16);
    y += photoH + GAP;
  }

  drawBohoStripes(totalH - STRIPE_H);
  ctx.fillStyle = '#5c3820';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER - STRIPE_H);
  ctx.strokeStyle = '#c8855a'; ctx.lineWidth = 1;
  ctx.strokeRect(8, totalH - FOOTER + 4, STRIP_W - 16, FOOTER - STRIPE_H - 8);

  ctx.fillStyle = '#f5e0c0';
  ctx.font = 'bold 14px "Bebas Neue", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 20);
  ctx.font = 'italic 9px Georgia, serif';
  ctx.fillStyle = '#c8855a';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 34);

  return canvas.toDataURL('image/png');
};

// ─── 🎉 FUN & TRENDY ─────────────────────────────────────────────────────────

// 16. Emoji Photostrip
const renderEmojiStrip: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  const bgEmojis = ['😊', '✨', '🎉', '💕', '🌟', '😎', '🔥', '💫'];
  drawScatter(ctx, bgEmojis, ['#000'], Math.ceil((STRIP_W / 30) * (totalH / 30)), totalH, 0.04);

  const makeRainbowGrad = () => {
    const hg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
    hg.addColorStop(0, '#ff6b6b'); hg.addColorStop(0.25, '#ffd93d');
    hg.addColorStop(0.5, '#6bcb77'); hg.addColorStop(0.75, '#4d96ff');
    hg.addColorStop(1, '#ff6bcd');
    return hg;
  };

  ctx.fillStyle = makeRainbowGrad();
  ctx.fillRect(0, 0, STRIP_W, HEADER);

  const headerEmojis = ['🌈', '⭐', '🎈', '💖', '🎊', '✨', '🎁', '🦄'];
  const emojiSpacing = STRIP_W / headerEmojis.length;
  ctx.font = '20px serif'; ctx.textAlign = 'center';
  headerEmojis.forEach((e, i) => ctx.fillText(e, (i + 0.5) * emojiSpacing, 24));
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px "Bebas Neue", sans-serif';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 44);

  const frameTints = ['#fff5f5', '#fffff5', '#f5fff5', '#f5f5ff'];
  const frameEmojis = [
    ['😊', '✨', '🎉', '💕'], ['😎', '🔥', '💫', '🌟'],
    ['🥳', '🎊', '🎈', '🎁'], ['😍', '💖', '🌈', '🦄'],
  ] as const;

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.fillStyle = frameTints[i % frameTints.length];
    drawRoundRect(ctx, PAD - 4, y - 4, photoW + 8, photoH + 8, RADIUS + 4);
    ctx.fill();
    ctx.save();
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.restore();
    const [e0, e1, e2, e3] = frameEmojis[i % frameEmojis.length];
    ctx.font = '16px serif';
    ctx.textAlign = 'left';  ctx.fillText(e0, PAD + 5, y + 20);
    ctx.textAlign = 'right'; ctx.fillText(e1, PAD + photoW - 5, y + 20);
    ctx.textAlign = 'left';  ctx.fillText(e2, PAD + 5, y + photoH - 5);
    ctx.textAlign = 'right'; ctx.fillText(e3, PAD + photoW - 5, y + photoH - 5);
    y += photoH + GAP;
  }

  ctx.fillStyle = makeRainbowGrad();
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.font = '18px serif'; ctx.textAlign = 'center';
  headerEmojis.forEach((e, i) => ctx.fillText(e, (i + 0.5) * emojiSpacing, totalH - FOOTER + 22));
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`LUMISNAP · ${new Date(getTimestamp(photos)).toLocaleDateString()}`, STRIP_W / 2, totalH - FOOTER + 40);

  return canvas.toDataURL('image/png');
};

// 17. Sticker Scrapbook
const renderScrapbook: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#f5ead5';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  for (let g = 0; g < 5000; g++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 60},${80 + Math.random() * 40},${40 + Math.random() * 30},${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * STRIP_W, Math.random() * totalH, 1, 1);
  }

  const TAPE_COLORS = [
    'rgba(255,182,193,0.6)', 'rgba(176,224,230,0.6)', 'rgba(255,218,185,0.6)'
  ] as const;

  const drawWashiTape = (startY: number) => {
    TAPE_COLORS.forEach((tc, ti) => {
      ctx.fillStyle = tc;
      ctx.save();
      ctx.translate(0, startY + (ti + 1) * 8 - 4);
      ctx.rotate(-0.02 + ti * 0.02);
      ctx.fillRect(-5, 0, STRIP_W + 10, 12);
      ctx.restore();
    });
  };

  drawWashiTape(0);

  ctx.fillStyle = '#3d2a1a';
  ctx.font = 'bold italic 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP ♡', STRIP_W / 2, 36);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#8b6a48';
  ctx.fillText('scrapbook journal · cute memories', STRIP_W / 2, 50);

  const tapeStrips = [
    'rgba(255,182,193,0.7)', 'rgba(176,224,230,0.7)',
    'rgba(255,218,185,0.7)', 'rgba(189,183,107,0.7)'
  ] as const;

  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.fillStyle = '#fff9f0';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.fillRect(PAD - 6, y - 6, photoW + 12, photoH + 12);
    ctx.shadowBlur = 0;
    ctx.save();
    drawRoundRect(ctx, PAD, y, photoW, photoH, 2);
    ctx.clip();
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.restore();

    // Corner tape
    [[PAD + 14, y - 2, -0.4], [PAD + photoW - 14, y - 2, 0.4]].forEach(([tx, ty, rot]) => {
      ctx.fillStyle = tapeStrips[i % tapeStrips.length];
      ctx.save();
      ctx.translate(tx as number, ty as number);
      ctx.rotate(rot as number);
      ctx.fillRect(-20, -6, 40, 10);
      ctx.restore();
    });

    ctx.fillStyle = '#c8a06a';
    ctx.font = 'italic 9px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(new Date(photos[i]?.timestamp ?? Date.now()).toLocaleDateString(), PAD + 5, y + photoH - 5);
    y += photoH + GAP;
  }

  drawWashiTape(totalH - FOOTER);

  ctx.fillStyle = '#3d2a1a';
  ctx.font = 'bold italic 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 28);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#8b6a48';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 42);

  return canvas.toDataURL('image/png');
};

// 18. Comic Style
const renderComicStyle: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#fff9e0';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Ben-day dots
  for (let dx = 0; dx < STRIP_W; dx += 8) {
    for (let dy = 0; dy < totalH; dy += 8) {
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,0,0.2)';
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, STRIP_W - 6, totalH - 6);

  const drawComicBand = (y: number, h: number) => {
    ctx.fillStyle = '#ffdd00'; ctx.fillRect(0, y, STRIP_W, h);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.strokeRect(0, y, STRIP_W, h);
  };

  drawComicBand(0, HEADER);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 30px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP!', STRIP_W / 2, 32);
  ctx.font = 'bold 11px "Bebas Neue", Impact, sans-serif';
  ctx.fillStyle = '#e00';
  ctx.fillText('⚡ PHOTOBOOTH COMICS ⚡', STRIP_W / 2, 50);

  const SPEECH_BUBBLES = ['Cheese! 📸', 'CLICK! ⚡', 'Perfect! ✨', 'Boom! 💥'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#fff' : '#fff9e0';
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.strokeRect(PAD, y, photoW, photoH);
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);

    // Speech bubble
    const [bx, by, bw, bh] = [PAD + 14, y + 10, 110, 28];
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + 20, by + bh - 2);
    ctx.lineTo(bx + 10, by + bh + 10);
    ctx.lineTo(bx + 32, by + bh - 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#111';
    ctx.font = 'bold 11px "Bebas Neue", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(SPEECH_BUBBLES[i % SPEECH_BUBBLES.length], bx + bw / 2, by + bh / 2 + 4);

    // Action lines
    ctx.strokeStyle = '#ffdd00'; ctx.lineWidth = 1.5;
    const [cx2, cy2] = [PAD + photoW - 20, y + 20];
    for (let al = 0; al < 8; al++) {
      const ang = (al * Math.PI) / 8 - Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx2 + Math.cos(ang) * 8, cy2 + Math.sin(ang) * 8);
      ctx.lineTo(cx2 + Math.cos(ang) * 22, cy2 + Math.sin(ang) * 22);
      ctx.stroke();
    }
    y += photoH + GAP;
  }

  drawComicBand(totalH - FOOTER, FOOTER);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 16px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP · TO BE CONTINUED...', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#555';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 19. Neon Glow
const renderNeonGlow: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  ctx.fillStyle = '#030310';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  ctx.strokeStyle = 'rgba(0,255,200,0.05)'; ctx.lineWidth = 0.5;
  for (let gx = 0; gx < STRIP_W; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, totalH); ctx.stroke();
  }
  for (let gy = 0; gy < totalH; gy += 20) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(STRIP_W, gy); ctx.stroke();
  }

  const neonOrbs = [
    { pos: [STRIP_W * 0.2, totalH * 0.2], color: 'rgba(0,255,255,0.08)' },
    { pos: [STRIP_W * 0.8, totalH * 0.5], color: 'rgba(255,0,255,0.08)' },
    { pos: [STRIP_W * 0.3, totalH * 0.8], color: 'rgba(0,255,100,0.08)' },
  ];
  neonOrbs.forEach(({ pos: [ox, oy], color }) => {
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 100);
    glow.addColorStop(0, color); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(ox, oy, 100, 0, Math.PI * 2); ctx.fill();
  });

  const makeNeonHeaderGrad = () => {
    const hg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
    hg.addColorStop(0, '#ff00cc'); hg.addColorStop(0.5, '#00ffcc'); hg.addColorStop(1, '#ff00cc');
    return hg;
  };

  ctx.fillStyle = makeNeonHeaderGrad();
  ctx.fillRect(0, 0, STRIP_W, HEADER);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 20;
  ctx.fillText('✦ LUMISNAP ✦', STRIP_W / 2, 30);
  ctx.shadowBlur = 0;
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('NEON GLOW · NIGHTLIFE EDITION', STRIP_W / 2, 46);

  const NEON_BORDERS = ['#00ffcc', '#ff00cc', '#00ccff', '#ff6600'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    ctx.shadowColor = NEON_BORDERS[i % NEON_BORDERS.length];
    ctx.shadowBlur = 22;
    ctx.strokeStyle = NEON_BORDERS[i % NEON_BORDERS.length];
    ctx.lineWidth = 2;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 2);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    ctx.fillStyle = `${NEON_BORDERS[i % NEON_BORDERS.length]}12`;
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  ctx.fillStyle = makeNeonHeaderGrad();
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 12;
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.shadowBlur = 0;
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// 20. Y2K Aesthetic
const renderY2K: RenderFn = async (photos) => {
  const { PAD, GAP, HEADER, FOOTER, RADIUS, photoW, photoH, totalH } = getLayout(photos);
  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  const bg = ctx.createLinearGradient(0, 0, STRIP_W, totalH);
  [0, 0.2, 0.4, 0.6, 0.8, 1].forEach((stop, i) => {
    bg.addColorStop(stop, ['#c8d8e8', '#e8f0f8', '#b8c8d8', '#d8e8f0', '#a8b8c8', '#c0d0e0'][i]);
  });
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Chrome reflection streaks
  for (let r = 0; r < 8; r++) {
    const ry = r * (totalH / 8);
    const ref = ctx.createLinearGradient(0, ry, STRIP_W, ry + totalH / 8);
    ref.addColorStop(0, 'rgba(255,255,255,0)');
    ref.addColorStop(0.4, 'rgba(255,255,255,0.12)');
    ref.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = ref;
    ctx.fillRect(0, ry, STRIP_W, totalH / 8);
  }

  const Y2K_COLORS = ['#ff00ff', '#00ffff', '#ff0080', '#8000ff', '#00ff80'] as const;
  drawScatter(ctx, ['✦', '★', '✩', '✧'], [...Y2K_COLORS], 60, totalH, 0.7);

  const makeChromeBandGrad = () => {
    const hg = ctx.createLinearGradient(0, 0, 0, HEADER);
    hg.addColorStop(0, '#a0b0ff'); hg.addColorStop(0.3, '#c0d0ff');
    hg.addColorStop(0.5, '#8090ee'); hg.addColorStop(0.7, '#c0d0ff');
    hg.addColorStop(1, '#a0b0ff');
    return hg;
  };

  const makeChromeLineGrad = () => {
    const g = ctx.createLinearGradient(0, 0, STRIP_W, 0);
    g.addColorStop(0, '#80a0ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#80a0ff');
    return g;
  };

  ctx.fillStyle = makeChromeBandGrad();
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = makeChromeLineGrad();
  ctx.lineWidth = 2; ctx.strokeRect(4, 4, STRIP_W - 8, HEADER - 8);

  ctx.fillStyle = '#0a0030';
  ctx.font = 'bold 26px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 28);
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#4000a0';
  ctx.fillText('Y2K DIGITAL · CYBER GLAM', STRIP_W / 2, 44);

  const CHROME_BORDERS = ['#a0b0ff', '#ff80ff', '#80ffcc', '#ffb020'];
  let y = HEADER + PAD;
  for (let i = 0; i < imgs.length; i++) {
    ctx.save();
    const cb = ctx.createLinearGradient(PAD, y, PAD + photoW, y + photoH);
    cb.addColorStop(0, CHROME_BORDERS[i % CHROME_BORDERS.length]);
    cb.addColorStop(0.5, '#ffffff');
    cb.addColorStop(1, CHROME_BORDERS[i % CHROME_BORDERS.length]);
    ctx.strokeStyle = cb;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = CHROME_BORDERS[i % CHROME_BORDERS.length];
    ctx.shadowBlur = 16;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS + 2);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(imgs[i], PAD, y, photoW, photoH);
    const gloss = ctx.createLinearGradient(PAD, y, PAD, y + photoH * 0.4);
    gloss.addColorStop(0, 'rgba(255,255,255,0.18)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();
    ctx.fillStyle = CHROME_BORDERS[i % CHROME_BORDERS.length];
    ctx.font = '12px serif';
    ctx.textAlign = 'left';  ctx.fillText('✦', PAD + 5, y + 16);
    ctx.textAlign = 'right'; ctx.fillText('✦', PAD + photoW - 5, y + 16);
    y += photoH + GAP;
  }

  ctx.fillStyle = makeChromeBandGrad();
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.strokeStyle = makeChromeLineGrad();
  ctx.lineWidth = 1.5;
  ctx.strokeRect(4, totalH - FOOTER + 4, STRIP_W - 8, FOOTER - 8);

  ctx.fillStyle = '#0a0030';
  ctx.font = 'bold 14px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#4000a0';
  ctx.fillText(new Date(getTimestamp(photos)).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 38);

  return canvas.toDataURL('image/png');
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const STRIP_TEMPLATES: StripTemplate[] = [
  // 🌸 Aesthetic & Cute
  { id: 'coquette',        name: 'Coquette', emoji: '🎀', description: 'Ribbon + soft pink',      render: renderCoquette        },
  { id: 'pastel-kawaii',   name: 'Kawaii',   emoji: '✿', description: 'Pastel doodle cute',       render: renderPastelKawaii    },
  { id: 'korean-minimal',  name: 'Korea',    emoji: '🤍', description: 'Clean white + thin font', render: renderKoreanMinimal   },
  { id: 'soft-blush',      name: 'Blush',    emoji: '🌷', description: 'Pink natural glow',       render: renderSoftBlush       },
  { id: 'milk-aesthetic',  name: 'Milk',     emoji: '🥛', description: 'White + creamy tone',     render: renderMilkAesthetic   },
  // 🎞️ Vintage & Retro
  { id: 'film-strip',      name: 'Film Roll', emoji: '🎞️', description: 'Analog 35mm film',       render: renderFilmStrip       },
  { id: 'bw-vintage',      name: 'B&W',       emoji: '⬛', description: 'Grain + classic B&W',    render: renderBWVintage       },
  { id: 'sepia-booth',     name: 'Sepia',     emoji: '🟫', description: 'Warm brown antique',     render: renderSepiaBooth      },
  { id: 'polaroid-strip',  name: 'Polaroid',  emoji: '📸', description: 'Classic polaroid frame', render: renderPolaroidStrip   },
  { id: 'retro-90s',       name: '90s Retro', emoji: '📼', description: 'Bold colors + grainy',   render: renderRetro90s        },
  // ✨ Elegant & Event
  { id: 'floral-wedding',       name: 'Floral',   emoji: '🌸', description: 'Flowers + greenery',  render: renderFloralWedding       },
  { id: 'gold-luxury',          name: 'Gold',     emoji: '✨', description: 'Gold accents + classy', render: renderGoldLuxury        },
  { id: 'minimalist-wedding',   name: 'Minimal',  emoji: '🤍', description: 'Simple + elegant',    render: renderMinimalistWedding   },
  { id: 'birthday-glitter',     name: 'Glitter',  emoji: '🎂', description: 'Sparkle + party vibes', render: renderBirthdayGlitter   },
  { id: 'boho',                 name: 'Boho',     emoji: '🌾', description: 'Earth tone aesthetic', render: renderBoho               },
  // 🎉 Fun & Trendy
  { id: 'emoji-strip',  name: 'Emoji',     emoji: '😊', description: 'Fun emoji frames',       render: renderEmojiStrip  },
  { id: 'scrapbook',    name: 'Scrapbook', emoji: '📔', description: 'Journal + washi tape',   render: renderScrapbook   },
  { id: 'comic-style',  name: 'Comic',     emoji: '💥', description: 'Speech bubbles + fun',   render: renderComicStyle  },
  { id: 'neon-glow',    name: 'Neon',      emoji: '🌃', description: 'Bright neon nightlife',  render: renderNeonGlow    },
  { id: 'y2k',          name: 'Y2K',       emoji: '💿', description: 'Chrome + cyber glam',    render: renderY2K         },
];