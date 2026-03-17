// src/utils/stripTemplates.ts
// 10 unique, fun photo strip templates.
// ALL use async loadImage() so every photo is guaranteed loaded before drawImage.

import type { Photo, StripTemplate } from '../types';
import { loadImage, drawRoundRect, generateId } from './photoUtils';

const STRIP_W = 420;

/** Load all photos as HTMLImageElements in parallel — guaranteed order */
async function loadAllPhotos(photos: Photo[]): Promise<HTMLImageElement[]> {
  return Promise.all(photos.map(p => loadImage(p.dataUrl)));
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

// ─── 1. Classic ───────────────────────────────────────────────────────────────
async function renderClassic(photos: Photo[]): Promise<string> {
  const PAD = 14, GAP = 8, HEADER = 52, FOOTER = 44, RADIUS = 6;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Cream background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Header band
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.fillStyle = '#ff3c3c';
  ctx.font = 'bold 26px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 32);
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.fillText(new Date(photos[0]?.timestamp ?? Date.now()).toLocaleDateString(), STRIP_W / 2, 46);

  // Photos — ALL 4 guaranteed via awaited imgs
  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.shadowColor = 'transparent';
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  // Footer band
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ff3c3c' : '#ffb800';
    ctx.beginPath();
    ctx.arc(STRIP_W / 2 - 40 + i * 20, totalH - FOOTER + 22, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL('image/png');
}

// ─── 2. Neon Night ────────────────────────────────────────────────────────────
async function renderNeonNight(photos: Photo[]): Promise<string> {
  const PAD = 16, GAP = 10, HEADER = 56, FOOTER = 48, RADIUS = 8;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Dark background with subtle grid
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  ctx.strokeStyle = 'rgba(100,0,255,0.08)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < STRIP_W; gx += 20) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, totalH); ctx.stroke();
  }
  for (let gy = 0; gy < totalH; gy += 20) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(STRIP_W, gy); ctx.stroke();
  }

  // Header
  const hGrad = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  hGrad.addColorStop(0, '#6600ff'); hGrad.addColorStop(1, '#00ffcc');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 18;
  ctx.fillText('✦ LUMISNAP ✦', STRIP_W / 2, 36);
  ctx.shadowBlur = 0;
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('NEON NIGHT', STRIP_W / 2, 50);

  // Photos with neon border glow
  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    ctx.shadowColor = '#6600ff'; ctx.shadowBlur = 16;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.strokeStyle = '#6600ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();
    y += photoH + GAP;
  }

  // Footer
  const fGrad = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  fGrad.addColorStop(0, '#6600ff'); fGrad.addColorStop(1, '#00ffcc');
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('★ CAPTURED WITH LUMISNAP ★', STRIP_W / 2, totalH - FOOTER + 28);

  return canvas.toDataURL('image/png');
}

// ─── 3. Polaroid Stack ────────────────────────────────────────────────────────
async function renderPolaroid(photos: Photo[]): Promise<string> {
  const FRAME = 18, BOTTOM = 56, GAP = 16;
  const photoW = STRIP_W - FRAME * 2 - 32;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const cardH = FRAME + photoH + BOTTOM;
  const totalH = photos.length * cardH + (photos.length - 1) * GAP + 40;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Warm linen background
  ctx.fillStyle = '#f0e8dc';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  // Subtle dots pattern
  ctx.fillStyle = 'rgba(0,0,0,0.03)';
  for (let px = 10; px < STRIP_W; px += 18)
    for (let py = 10; py < totalH; py += 18) {
      ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
    }

  const rotations = [-3, 2, -1.5, 2.5];
  let y = 20;
  imgs.forEach((img, i) => {
    const rot = rotations[i % rotations.length] * Math.PI / 180;
    const cx = STRIP_W / 2;
    const cy = y + cardH / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Card shadow
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#fff';
    ctx.fillRect(-photoW / 2 - FRAME, -cardH / 2, photoW + FRAME * 2, cardH);
    ctx.shadowColor = 'transparent';

    // Photo
    ctx.drawImage(img, -photoW / 2, -cardH / 2 + FRAME, photoW, photoH);

    // Caption area
    ctx.fillStyle = '#fff';
    ctx.fillRect(-photoW / 2 - FRAME, -cardH / 2 + FRAME + photoH, photoW + FRAME * 2, BOTTOM);

    // Caption text
    ctx.fillStyle = '#555';
    ctx.font = 'italic 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      new Date(photos[i]?.timestamp ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      0,
      -cardH / 2 + FRAME + photoH + 34
    );

    ctx.restore();
    y += cardH + GAP;
  });

  return canvas.toDataURL('image/png');
}

// ─── 4. Comic Strip ───────────────────────────────────────────────────────────
async function renderComic(photos: Photo[]): Promise<string> {
  const BORDER = 6, PAD = 10, GAP = 6, HEADER = 64, FOOTER = 40;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Yellow comic background
  ctx.fillStyle = '#fff9e6';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Ben-day dots
  ctx.fillStyle = 'rgba(255,220,0,0.3)';
  for (let dx = 0; dx < STRIP_W; dx += 10)
    for (let dy = 0; dy < totalH; dy += 10) {
      ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill();
    }

  // Outer border — thick comic style
  ctx.strokeStyle = '#111';
  ctx.lineWidth = BORDER;
  ctx.strokeRect(BORDER / 2, BORDER / 2, STRIP_W - BORDER, totalH - BORDER);

  // Header
  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(0, 0, STRIP_W, HEADER);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, STRIP_W, HEADER);

  ctx.fillStyle = '#111';
  ctx.font = 'bold 32px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('POW! SNAP!', STRIP_W / 2, 38);
  ctx.font = 'bold 12px "Bebas Neue", Impact, sans-serif';
  ctx.fillStyle = '#e00';
  ctx.fillText('⚡ LUMISNAP COMICS ⚡', STRIP_W / 2, 58);

  // Speech bubble positions
  const bubbles = ['Cheese!', 'CLICK!', '★ SNAP! ★', 'POW! ✨'];

  let y = HEADER + PAD;
  imgs.forEach((img, i) => {
    // Panel border
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    ctx.strokeRect(PAD, y, photoW, photoH);
    ctx.drawImage(img, PAD, y, photoW, photoH);

    // Speech bubble
    const bx = PAD + 14, by = y + 10, bw = 100, bh = 28;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 12px "Bebas Neue", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bubbles[i % bubbles.length], bx + bw / 2, by + bh / 2 + 5);

    y += photoH + GAP;
  });

  // Footer
  ctx.fillStyle = '#ffdd00';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.fillStyle = '#111';
  ctx.font = 'bold 14px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TO BE CONTINUED...', STRIP_W / 2, totalH - FOOTER + 26);

  return canvas.toDataURL('image/png');
}

// ─── 5. Film Noir ─────────────────────────────────────────────────────────────
async function renderFilmNoir(photos: Photo[]): Promise<string> {
  const PAD = 16, GAP = 4, HEADER = 60, FOOTER = 52, RADIUS = 2;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Black background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Film sprocket holes
  const sprocketY = [HEADER / 2, totalH - FOOTER / 2];
  sprocketY.forEach(sy => {
    for (let sx = 16; sx < STRIP_W - 16; sx += 28) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(sx - 5, sy - 8, 10, 16);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
      ctx.strokeRect(sx - 5, sy - 8, 10, 16);
    }
  });

  // Header text
  ctx.fillStyle = '#c8b97a'; // warm gold
  ctx.font = 'bold italic 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP', STRIP_W / 2, 38);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#666';
  ctx.fillText('© ' + new Date(photos[0]?.timestamp ?? Date.now()).getFullYear() + ' · NOIR EDITION', STRIP_W / 2, 54);

  // Photos with vignette
  let y = HEADER + PAD;
  for (const img of imgs) {
    ctx.save();
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.drawImage(img, PAD, y, photoW, photoH);

    // B&W tint overlay
    const id = ctx.getImageData(PAD, y, photoW, photoH);
    const d = id.data;
    for (let j = 0; j < d.length; j += 4) {
      const g = d[j] * 0.299 + d[j+1] * 0.587 + d[j+2] * 0.114;
      d[j] = d[j+1] = d[j+2] = g;
    }
    ctx.putImageData(id, PAD, y);

    // Vignette
    const vig = ctx.createRadialGradient(PAD + photoW/2, y + photoH/2, photoH*0.25, PAD + photoW/2, y + photoH/2, photoH*0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();

    y += photoH + GAP;
  }

  // Footer
  ctx.strokeStyle = '#c8b97a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, totalH - FOOTER + 8); ctx.lineTo(STRIP_W - PAD, totalH - FOOTER + 8); ctx.stroke();
  ctx.fillStyle = '#c8b97a';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('"The night holds all secrets"', STRIP_W / 2, totalH - FOOTER + 30);
  ctx.font = '10px monospace';
  ctx.fillStyle = '#444';
  ctx.fillText('LUMISNAP NOIR · ' + new Date(photos[0]?.timestamp ?? Date.now()).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 46);

  return canvas.toDataURL('image/png');
}

// ─── 6. Kawaii Pastel ─────────────────────────────────────────────────────────
async function renderKawaii(photos: Photo[]): Promise<string> {
  const PAD = 18, GAP = 12, HEADER = 68, FOOTER = 56, RADIUS = 16;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Pink gradient bg
  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, '#ffe4f0');
  bg.addColorStop(0.5, '#fff0fb');
  bg.addColorStop(1, '#e8f0ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Star decorations
  const stars = ['✦', '✿', '♡', '★', '✦', '✿', '♡', '★'];
  ctx.fillStyle = 'rgba(255,150,200,0.22)';
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  stars.forEach((s, i) => {
    ctx.fillText(s, 20 + (i % 2) * (STRIP_W - 40), 60 + i * (totalH / stars.length));
  });

  // Header
  ctx.fillStyle = '#ff85c2';
  ctx.beginPath();
  ctx.ellipse(STRIP_W / 2, HEADER / 2, STRIP_W / 2, HEADER / 2 + 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 28px "Bebas Neue", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff85c2'; ctx.shadowBlur = 12;
  ctx.fillText('♡ LUMISNAP ♡', STRIP_W / 2, 30);
  ctx.shadowBlur = 0;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('kawaii edition ˙˚₊', STRIP_W / 2, 50);

  // Photos
  let y = HEADER + PAD;
  const borderColors = ['#ffb3d9', '#b3d9ff', '#b3ffde', '#ffd9b3'];
  imgs.forEach((img, i) => {
    ctx.save();
    ctx.shadowColor = borderColors[i % borderColors.length];
    ctx.shadowBlur = 12;
    ctx.strokeStyle = borderColors[i % borderColors.length];
    ctx.lineWidth = 3;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.stroke();
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();

    // Corner hearts
    ctx.font = '18px serif';
    ctx.fillStyle = borderColors[i % borderColors.length];
    ctx.textAlign = 'left';
    ctx.fillText('♡', PAD + 4, y + 22);
    ctx.textAlign = 'right';
    ctx.fillText('♡', STRIP_W - PAD - 4, y + 22);

    y += photoH + GAP;
  });

  // Footer
  ctx.fillStyle = '#ff85c2';
  ctx.beginPath();
  ctx.ellipse(STRIP_W / 2, totalH - FOOTER / 2, STRIP_W / 2, FOOTER / 2 + 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ cute memories forever ✦', STRIP_W / 2, totalH - FOOTER / 2 + 5);

  return canvas.toDataURL('image/png');
}

// ─── 7. Vintage Newspaper ─────────────────────────────────────────────────────
async function renderNewspaper(photos: Photo[]): Promise<string> {
  const PAD = 14, GAP = 8, HEADER = 88, FOOTER = 48;
  const photoW = (STRIP_W - PAD * 2);
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Aged paper
  ctx.fillStyle = '#f2ead8';
  ctx.fillRect(0, 0, STRIP_W, totalH);
  // Grain texture
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * STRIP_W, Math.random() * totalH, 1, 1);
  }

  // Newspaper header
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, STRIP_W - 16, HEADER - 8);
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(12, 40); ctx.lineTo(STRIP_W - 12, 40); ctx.stroke();

  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE LUMISNAP GAZETTE', STRIP_W / 2, 34);
  ctx.font = 'italic 10px Georgia, serif';
  ctx.fillStyle = '#555';
  ctx.fillText('Vol. 1 · Photo Edition · Est. ' + new Date().getFullYear(), STRIP_W / 2, 54);

  ctx.font = 'bold italic 14px Georgia, serif';
  ctx.fillStyle = '#333';
  ctx.fillText('"ALL THE MOMENTS FIT TO PRINT"', STRIP_W / 2, 72);
  ctx.font = '10px Georgia, serif';
  ctx.fillStyle = '#888';
  ctx.fillText(new Date(photos[0]?.timestamp ?? Date.now()).toDateString().toUpperCase(), STRIP_W / 2, 84);

  // Photos with B&W + news caption
  const captions = [
    'Breaking: Subject Photographed',
    'Sources Confirm: Smile Detected',
    'Exclusive: Perfect Shot Captured',
    'Late Edition: Final Frame Released',
  ];
  let y = HEADER + PAD;
  imgs.forEach((img, i) => {
    // Draw image + apply newspaper B&W
    ctx.drawImage(img, PAD, y, photoW, photoH);
    const id = ctx.getImageData(PAD, y, photoW, photoH);
    const d = id.data;
    for (let j = 0; j < d.length; j += 4) {
      const g = d[j] * 0.299 + d[j+1] * 0.587 + d[j+2] * 0.114;
      d[j] = d[j+1] = d[j+2] = g * 0.92 + 10;
    }
    ctx.putImageData(id, PAD, y);

    // Caption bar
    const capH = 20;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(PAD, y + photoH - capH, photoW, capH);
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'italic 10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(captions[i % captions.length], PAD + 6, y + photoH - 6);

    // Border
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
    ctx.strokeRect(PAD, y, photoW, photoH);

    y += photoH + GAP;
  });

  // Footer rule
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, totalH - FOOTER + 8); ctx.lineTo(STRIP_W - PAD, totalH - FOOTER + 8); ctx.stroke();
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('LUMISNAP PHOTOBOOTH · GENUINE MEMORIES', STRIP_W / 2, totalH - FOOTER + 28);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('Printed on ' + new Date().toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 42);

  return canvas.toDataURL('image/png');
}

// ─── 8. Retro Arcade ──────────────────────────────────────────────────────────
async function renderArcade(photos: Photo[]): Promise<string> {
  const PAD = 14, GAP = 10, HEADER = 70, FOOTER = 56, RADIUS = 0;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Dark arcade background
  ctx.fillStyle = '#020210';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Scanline effect
  for (let sl = 0; sl < totalH; sl += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, sl, STRIP_W, 1);
  }

  // Pixel grid border
  ctx.strokeStyle = '#00ff41'; ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, STRIP_W - 8, totalH - 8);
  ctx.strokeStyle = '#00ff4144'; ctx.lineWidth = 1;
  ctx.strokeRect(8, 8, STRIP_W - 16, totalH - 16);

  // Header — pixel font style
  ctx.fillStyle = '#00ff41';
  ctx.font = 'bold 30px "Bebas Neue", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ff41'; ctx.shadowBlur = 20;
  ctx.fillText('LUMISNAP', STRIP_W / 2, 38);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ff2a6d';
  ctx.font = 'bold 14px monospace';
  ctx.shadowColor = '#ff2a6d'; ctx.shadowBlur = 10;
  ctx.fillText('INSERT COIN TO CONTINUE', STRIP_W / 2, 58);
  ctx.shadowBlur = 0;

  // Score display
  ctx.fillStyle = '#ffdd00';
  ctx.font = '10px monospace';
  ctx.fillText(`SCORE: ${photos.length * 1000}   HI: 9999`, STRIP_W / 2, 70);

  // Photos with pixel border
  let y = HEADER + PAD;
  const colors = ['#00ff41', '#ff2a6d', '#00d4ff', '#ffdd00'];
  imgs.forEach((img, i) => {
    const col = colors[i % colors.length];
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.strokeRect(PAD, y, photoW, photoH);
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);

    // Player label
    ctx.fillStyle = col;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`▶ P${i + 1}`, PAD + 4, y + 14);

    y += photoH + GAP;
  });

  // Footer
  const fg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  fg.addColorStop(0, '#ff2a6d'); fg.addColorStop(0.5, '#00ff41'); fg.addColorStop(1, '#00d4ff');
  ctx.fillStyle = fg;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ GAME OVER · THANKS FOR PLAYING ★', STRIP_W / 2, totalH - FOOTER + 22);
  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText(new Date(photos[0]?.timestamp ?? Date.now()).toLocaleDateString(), STRIP_W / 2, totalH - FOOTER + 40);

  return canvas.toDataURL('image/png');
}

// ─── 9. Golden Hour ───────────────────────────────────────────────────────────
async function renderGoldenHour(photos: Photo[]): Promise<string> {
  const PAD = 16, GAP = 12, HEADER = 64, FOOTER = 52, RADIUS = 12;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // Warm sunset gradient
  const bg = ctx.createLinearGradient(0, 0, 0, totalH);
  bg.addColorStop(0, '#2d1b00');
  bg.addColorStop(0.3, '#7a3500');
  bg.addColorStop(0.6, '#c85a00');
  bg.addColorStop(1, '#2d0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Sun rays
  ctx.save();
  ctx.globalAlpha = 0.06;
  for (let r = 0; r < 16; r++) {
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.moveTo(STRIP_W / 2, -50);
    const a1 = (r * Math.PI * 2) / 16;
    const a2 = a1 + Math.PI / 20;
    ctx.arc(STRIP_W / 2, -50, totalH + 100, a1, a2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Header
  const hg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  hg.addColorStop(0, '#ff6b00'); hg.addColorStop(1, '#ffcc00');
  ctx.fillStyle = hg;
  ctx.font = 'bold 32px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff6b00'; ctx.shadowBlur = 24;
  ctx.fillText('GOLDEN HOUR', STRIP_W / 2, 38);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,200,100,0.7)';
  ctx.font = '11px monospace';
  ctx.fillText('✦ LUMISNAP · ' + new Date(photos[0]?.timestamp ?? Date.now()).toLocaleDateString() + ' ✦', STRIP_W / 2, 56);

  // Photos with warm overlay
  let y = HEADER + PAD;
  imgs.forEach((img, i) => {
    ctx.save();
    ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 16;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    // Warm tint
    ctx.fillStyle = 'rgba(255,100,0,0.12)';
    ctx.fillRect(PAD, y, photoW, photoH);
    // Top vignette
    const topV = ctx.createLinearGradient(0, y, 0, y + photoH * 0.3);
    topV.addColorStop(0, 'rgba(0,0,0,0.35)');
    topV.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topV;
    ctx.fillRect(PAD, y, photoW, photoH);
    ctx.restore();

    // Decorative divider
    if (i < imgs.length - 1) {
      ctx.fillStyle = 'rgba(255,180,0,0.3)';
      ctx.fillRect(PAD + 40, y + photoH + GAP / 2 - 1, photoW - 80, 2);
    }
    y += photoH + GAP;
  });

  // Footer
  const fg = ctx.createLinearGradient(0, 0, STRIP_W, 0);
  fg.addColorStop(0, '#ff6b00'); fg.addColorStop(1, '#ffcc00');
  ctx.fillStyle = fg;
  ctx.font = 'bold 15px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHASING THE LIGHT · LUMISNAP', STRIP_W / 2, totalH - FOOTER + 24);
  ctx.fillStyle = 'rgba(255,200,100,0.5)';
  ctx.font = '10px monospace';
  ctx.fillText('captured in the golden hour', STRIP_W / 2, totalH - FOOTER + 42);

  return canvas.toDataURL('image/png');
}

// ─── 10. Confetti Party ───────────────────────────────────────────────────────
async function renderParty(photos: Photo[]): Promise<string> {
  const PAD = 16, GAP = 12, HEADER = 72, FOOTER = 60, RADIUS = 10;
  const photoW = STRIP_W - PAD * 2;
  const ar = photos[0] ? photos[0].height / photos[0].width : 0.75;
  const photoH = Math.round(photoW * ar);
  const totalH = HEADER + FOOTER + photos.length * photoH + (photos.length - 1) * GAP + PAD * 2;

  const [canvas, ctx] = makeCanvas(STRIP_W, totalH);
  const imgs = await loadAllPhotos(photos);

  // White base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STRIP_W, totalH);

  // Confetti
  const confettiColors = ['#ff3c3c','#ffb800','#00d4ff','#ff69b4','#7cfc00','#9b59b6','#ff8c00'];
  const rng = (n: number) => Math.floor(Math.random() * n);
  for (let c = 0; c < 180; c++) {
    ctx.save();
    ctx.fillStyle = confettiColors[rng(confettiColors.length)];
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    const cx2 = rng(STRIP_W), cy2 = rng(totalH);
    ctx.translate(cx2, cy2);
    ctx.rotate(Math.random() * Math.PI * 2);
    if (c % 3 === 0) {
      ctx.fillRect(-6, -3, 12, 6);
    } else if (c % 3 === 1) {
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // Header burst
  ctx.fillStyle = '#ffb800';
  ctx.beginPath();
  for (let sp = 0; sp < 12; sp++) {
    const a = (sp * Math.PI * 2) / 12 - Math.PI / 2;
    const r2 = sp % 2 === 0 ? STRIP_W / 2 + 20 : STRIP_W / 3;
    ctx.lineTo(STRIP_W / 2 + Math.cos(a) * r2, HEADER / 2 + Math.sin(a) * r2);
  }
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6;
  ctx.fillText('🎉 LUMISNAP 🎉', STRIP_W / 2, 34);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText('PARTY EDITION', STRIP_W / 2, 52);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(new Date(photos[0]?.timestamp ?? Date.now()).toLocaleDateString(), STRIP_W / 2, 66);

  // Photos
  let y = HEADER + PAD;
  const borders = ['#ff3c3c','#ffb800','#00d4ff','#ff69b4'];
  imgs.forEach((img, i) => {
    ctx.save();
    ctx.shadowColor = borders[i % borders.length]; ctx.shadowBlur = 14;
    ctx.strokeStyle = borders[i % borders.length]; ctx.lineWidth = 4;
    drawRoundRect(ctx, PAD, y, photoW, photoH, RADIUS);
    ctx.stroke(); ctx.clip();
    ctx.shadowBlur = 0;
    ctx.drawImage(img, PAD, y, photoW, photoH);
    ctx.restore();

    // Emoji corner
    const emojis = ['🎉','🥳','✨','🎊'];
    ctx.font = '20px serif';
    ctx.textAlign = 'right';
    ctx.fillText(emojis[i % emojis.length], PAD + photoW - 4, y + 26);

    y += photoH + GAP;
  });

  // Footer
  ctx.fillStyle = '#ffb800';
  ctx.fillRect(0, totalH - FOOTER, STRIP_W, FOOTER);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Bebas Neue", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎊 KEEP CELEBRATING LIFE! 🎊', STRIP_W / 2, totalH - FOOTER + 26);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('LUMISNAP PHOTOBOOTH', STRIP_W / 2, totalH - FOOTER + 46);

  return canvas.toDataURL('image/png');
}

// ─── Export ───────────────────────────────────────────────────────────────────
export const STRIP_TEMPLATES: StripTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🎞️',
    description: 'Clean darkroom style',
    render: renderClassic,
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    emoji: '🌃',
    description: 'Cyberpunk glow',
    render: renderNeonNight,
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    emoji: '📸',
    description: 'Tilted Polaroid cards',
    render: renderPolaroid,
  },
  {
    id: 'comic',
    name: 'Comic Strip',
    emoji: '💥',
    description: 'POW! BAM! SNAP!',
    render: renderComic,
  },
  {
    id: 'noir',
    name: 'Film Noir',
    emoji: '🎬',
    description: 'B&W cinematic mood',
    render: renderFilmNoir,
  },
  {
    id: 'kawaii',
    name: 'Kawaii',
    emoji: '🌸',
    description: 'Cute pastel hearts',
    render: renderKawaii,
  },
  {
    id: 'newspaper',
    name: 'Gazette',
    emoji: '📰',
    description: 'Vintage newspaper',
    render: renderNewspaper,
  },
  {
    id: 'arcade',
    name: 'Arcade',
    emoji: '🕹️',
    description: 'Retro pixel game',
    render: renderArcade,
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    emoji: '🌅',
    description: 'Warm sunset tones',
    render: renderGoldenHour,
  },
  {
    id: 'party',
    name: 'Party',
    emoji: '🎉',
    description: 'Confetti explosion',
    render: renderParty,
  },
];
