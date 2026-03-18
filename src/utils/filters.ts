// src/utils/filters.ts
// Instagram-style filters + beauty/aesthetic effects.
// cssFilter  → applied live on <video> via CSS filter property
// canvasTransform → applied when capturing to canvas (pixel-level for accuracy)

import type { FilterConfig, FilterType } from '../types';

// ── Helper: pixel manipulation shortcuts ─────────────────────────────────────

function applyPixels(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  fn: (r: number, g: number, b: number) => [number, number, number]
) {
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = fn(d[i], d[i + 1], d[i + 2]);
    d[i] = Math.min(255, Math.max(0, r));
    d[i + 1] = Math.min(255, Math.max(0, g));
    d[i + 2] = Math.min(255, Math.max(0, b));
  }
  ctx.putImageData(id, 0, 0);
}

function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.5) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function overlay(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}

function brightness(v: number, amt: number) { return v * amt; }
function contrast(v: number, factor: number) { return factor * (v - 128) + 128; }
function saturatePixel(r: number, g: number, b: number, s: number): [number, number, number] {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return [gray + s * (r - gray), gray + s * (g - gray), gray + s * (b - gray)];
}

// ── Filter definitions ────────────────────────────────────────────────────────

export const FILTERS: FilterConfig[] = [
  // ── 0. Normal ──────────────────────────────────────────────────────────────
  {
    id: 'none',
    label: 'Normal',
    cssFilter: '',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTAGRAM CLASSIC
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. Clarendon – bright + contrasty, great for selfies ──────────────────
  {
    id: 'clarendon',
    label: 'Clarendon',
    cssFilter: 'brightness(1.1) contrast(1.25) saturate(1.35)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.35);
        return [contrast(brightness(sr, 1.1), 1.25), contrast(brightness(sg, 1.1), 1.25), contrast(brightness(sb, 1.1), 1.25)];
      });
    },
  },

  // ── 2. Gingham – soft & vintage ───────────────────────────────────────────
  {
    id: 'gingham',
    label: 'Gingham',
    cssFilter: 'brightness(1.05) sepia(15%) contrast(0.9) saturate(0.85)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const soft = [r * 0.95 + 12, g * 0.97 + 8, b * 0.9 + 5] as [number, number, number];
        return saturatePixel(soft[0], soft[1], soft[2], 0.85);
      });
    },
  },

  // ── 3. Juno – warm pop colours ────────────────────────────────────────────
  {
    id: 'juno',
    label: 'Juno',
    cssFilter: 'brightness(1.08) contrast(1.1) saturate(1.5) hue-rotate(5deg)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.5);
        return [sr * 1.08 + 8, sg * 1.05, sb * 0.98];
      });
    },
  },

  // ── 4. Lark – bright natural ──────────────────────────────────────────────
  {
    id: 'lark',
    label: 'Lark',
    cssFilter: 'brightness(1.15) contrast(0.95) saturate(1.1)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [brightness(r, 1.15), brightness(g, 1.12), brightness(b, 1.05)];
      });
      overlay(ctx, w, h, 'rgba(220,240,255,0.06)');
    },
  },

  // ── 5. Valencia – warm & glowing ──────────────────────────────────────────
  {
    id: 'valencia',
    label: 'Valencia',
    cssFilter: 'brightness(1.08) sepia(25%) saturate(1.2) contrast(1.05)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.08 + 15, g * 1.02 + 5, b * 0.92];
      });
      overlay(ctx, w, h, 'rgba(255,180,80,0.08)');
    },
  },

  // ── 6. Sierra – soft blur aesthetic ──────────────────────────────────────
  {
    id: 'sierra',
    label: 'Sierra',
    cssFilter: 'brightness(1.05) sepia(20%) contrast(0.92) saturate(0.9)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.88);
        return [sr * 1.05 + 8, sg + 5, sb + 3];
      });
      vignette(ctx, w, h, 0.2);
    },
  },

  // ── 7. Mayfair – soft glow + vignette ────────────────────────────────────
  {
    id: 'mayfair',
    label: 'Mayfair',
    cssFilter: 'brightness(1.1) contrast(1.05) saturate(1.2)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.1 + 5, g * 1.08 + 3, b * 1.0];
      });
      // Soft center glow
      const glow = ctx.createRadialGradient(w / 2, h / 3, 0, w / 2, h / 3, w * 0.7);
      glow.addColorStop(0, 'rgba(255,240,200,0.12)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      vignette(ctx, w, h, 0.3);
    },
  },

  // ── 8. Walden – bright center + cool ─────────────────────────────────────
  {
    id: 'walden',
    label: 'Walden',
    cssFilter: 'brightness(1.1) saturate(1.15) hue-rotate(-10deg)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.05, g * 1.1 + 5, b * 1.15 + 8];
      });
      overlay(ctx, w, h, 'rgba(160,210,255,0.07)');
    },
  },

  // ── 9. Ludwig – clean & elegant ──────────────────────────────────────────
  {
    id: 'ludwig',
    label: 'Ludwig',
    cssFilter: 'brightness(1.05) contrast(1.08) saturate(0.95)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.95);
        return [brightness(sr, 1.05), brightness(sg, 1.05), brightness(sb, 1.05)];
      });
    },
  },

  // ── 10. X-Pro II – dramatic & bold ───────────────────────────────────────
  {
    id: 'xpro2',
    label: 'X-Pro II',
    cssFilter: 'contrast(1.4) saturate(1.5) brightness(0.95) sepia(15%)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.5);
        return [contrast(sr, 1.4), contrast(sg, 1.4), contrast(sb * 0.9, 1.4)];
      });
      vignette(ctx, w, h, 0.45);
      overlay(ctx, w, h, 'rgba(80,0,120,0.06)');
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAUTY / FACE EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 11. Renegade – sunny bright look ─────────────────────────────────────
  {
    id: 'renegade',
    label: 'Renegade',
    cssFilter: 'brightness(1.2) contrast(1.05) saturate(1.25)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.2 + 10, g * 1.15 + 8, b * 1.05];
      });
      overlay(ctx, w, h, 'rgba(255,240,180,0.08)');
    },
  },

  // ── 12. Cinema 7 – vintage aesthetic ─────────────────────────────────────
  {
    id: 'cinema7',
    label: 'Cinema 7',
    cssFilter: 'sepia(35%) contrast(1.15) brightness(0.95) saturate(1.1)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 0.92 + g * 0.08 + 20, g * 0.88 + 10, b * 0.75 + 5];
      });
      vignette(ctx, w, h, 0.35);
    },
  },

  // ── 13. Boho – soft natural beauty ───────────────────────────────────────
  {
    id: 'boho',
    label: 'Boho',
    cssFilter: 'brightness(1.08) saturate(0.85) sepia(18%) contrast(0.95)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.85);
        return [sr * 1.06 + 10, sg * 1.04 + 6, sb * 0.96 + 4];
      });
    },
  },

  // ── 14. Pink Preset – pinkish glow ───────────────────────────────────────
  {
    id: 'pinkpreset',
    label: 'Pink Preset',
    cssFilter: 'brightness(1.1) saturate(1.3) hue-rotate(330deg)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.12 + 15, g * 0.95, b * 1.05 + 8];
      });
      overlay(ctx, w, h, 'rgba(255,180,200,0.1)');
    },
  },

  // ── 15. Moody – dark aesthetic ────────────────────────────────────────────
  {
    id: 'moody',
    label: 'Moody',
    cssFilter: 'brightness(0.88) contrast(1.2) saturate(0.9) sepia(10%)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.85);
        return [contrast(sr * 0.88, 1.2), contrast(sg * 0.88, 1.2), contrast(sb * 0.88 + 10, 1.15)];
      });
      vignette(ctx, w, h, 0.4);
    },
  },

  // ── 16. Ciao Bella – natural makeup look ─────────────────────────────────
  {
    id: 'ciaobella',
    label: 'Ciao Bella',
    cssFilter: 'brightness(1.08) contrast(1.05) saturate(1.15)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.08 + 8, g * 1.04 + 5, b * 1.02];
      });
      overlay(ctx, w, h, 'rgba(255,220,200,0.07)');
    },
  },

  // ── 17. Almond Milk – creamy soft skin ───────────────────────────────────
  {
    id: 'almondmilk',
    label: 'Almond Milk',
    cssFilter: 'brightness(1.12) saturate(0.8) sepia(12%) contrast(0.92)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.8);
        return [sr * 1.12 + 12, sg * 1.1 + 8, sb * 1.05 + 6];
      });
      overlay(ctx, w, h, 'rgba(255,245,230,0.08)');
    },
  },

  // ── 18. Honeysuckle – warm & glowing ─────────────────────────────────────
  {
    id: 'honeysuckle',
    label: 'Honeysuckle',
    cssFilter: 'brightness(1.1) saturate(1.3) sepia(20%) contrast(1.05)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.12 + 18, g * 1.05 + 8, b * 0.9];
      });
      overlay(ctx, w, h, 'rgba(255,200,100,0.09)');
    },
  },

  // ── 19. Top Model – sharp & defined ──────────────────────────────────────
  {
    id: 'topmodel',
    label: 'Top Model',
    cssFilter: 'brightness(1.05) contrast(1.3) saturate(1.1)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.1);
        return [contrast(sr * 1.05, 1.3), contrast(sg * 1.05, 1.3), contrast(sb * 1.05, 1.3)];
      });
      vignette(ctx, w, h, 0.2);
    },
  },

  // ── 20. Cuteness Burst – bright & cute ───────────────────────────────────
  {
    id: 'cuteness',
    label: 'Cuteness',
    cssFilter: 'brightness(1.18) saturate(1.4) contrast(0.95) hue-rotate(355deg)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.4);
        return [sr * 1.18 + 12, sg * 1.12 + 8, sb * 1.08 + 5];
      });
      overlay(ctx, w, h, 'rgba(255,200,230,0.1)');
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AESTHETIC & VIRAL
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 21. Beauty Mix – smoothing + glow ────────────────────────────────────
  {
    id: 'beautymix',
    label: 'Beauty Mix',
    cssFilter: 'brightness(1.1) contrast(0.95) saturate(1.1)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.1 + 10, g * 1.08 + 8, b * 1.06 + 6];
      });
      // Soft glow center
      const glow = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.6);
      glow.addColorStop(0, 'rgba(255,255,255,0.1)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ── 22. LV Shine – glossy face ───────────────────────────────────────────
  {
    id: 'lvshine',
    label: 'LV Shine',
    cssFilter: 'brightness(1.15) contrast(1.05) saturate(1.15)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.15 + 8, g * 1.12 + 6, b * 1.05 + 4];
      });
      const shine = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.5);
      shine.addColorStop(0, 'rgba(255,255,220,0.15)');
      shine.addColorStop(0.5, 'rgba(255,255,200,0.05)');
      shine.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shine;
      ctx.fillRect(0, 0, w, h);
    },
  },

  // ── 23. U Make Me Blush – natural blush ──────────────────────────────────
  {
    id: 'blush',
    label: 'Blush',
    cssFilter: 'brightness(1.08) saturate(1.2) hue-rotate(350deg)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        return [r * 1.1 + 12, g * 0.98, b * 0.96];
      });
      overlay(ctx, w, h, 'rgba(255,160,160,0.08)');
    },
  },

  // ── 24. Milk*Three – soft pale aesthetic ─────────────────────────────────
  {
    id: 'milkthree',
    label: 'Milk×3',
    cssFilter: 'brightness(1.15) saturate(0.7) contrast(0.9)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 0.65);
        return [sr * 1.15 + 18, sg * 1.12 + 14, sb * 1.1 + 12];
      });
      overlay(ctx, w, h, 'rgba(255,255,255,0.12)');
    },
  },

  // ── 25. KiraKira – sparkle glitter effect ────────────────────────────────
  {
    id: 'kirakira',
    label: 'KiraKira',
    cssFilter: 'brightness(1.12) saturate(1.25) contrast(1.05)',
    canvasTransform: (ctx, w, h) => {
      applyPixels(ctx, w, h, (r, g, b) => {
        const [sr, sg, sb] = saturatePixel(r, g, b, 1.25);
        return [sr * 1.1 + 8, sg * 1.08 + 6, sb * 1.12 + 10];
      });
      // Sparkle dots
      for (let i = 0; i < 40; i++) {
        const sx = Math.random() * w, sy = Math.random() * h;
        const size = 2 + Math.random() * 4;
        const alpha = 0.4 + Math.random() * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Cross sparkle
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - size, sy); ctx.lineTo(sx + size, sy);
        ctx.moveTo(sx, sy - size); ctx.lineTo(sx, sy + size);
        ctx.stroke();
        ctx.restore();
      }
    },
  },

  // ── Mirror (legacy, keep for compatibility) ───────────────────────────────
  {
    id: 'mirror',
    label: 'Mirror',
    cssFilter: '',
  },
];

// ── CSS helpers (unchanged logic) ────────────────────────────────────────────

export function getCssFilter(filter: FilterType, isMirror: boolean): string {
  if (filter === 'mirror') return '';
  const def = FILTERS.find(f => f.id === filter);
  return def?.cssFilter ?? '';
}

export function getCssTransform(filter: FilterType, isMirror: boolean): string {
  const parts: string[] = [];
  if (isMirror || filter === 'mirror') parts.push('scaleX(-1)');
  return parts.join(' ');
}