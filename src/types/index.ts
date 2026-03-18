// src/types/index.ts

export type FilterType =
  | 'none'
  // ── Instagram Classic ──
  | 'clarendon' | 'gingham' | 'juno' | 'lark' | 'valencia'
  | 'sierra' | 'mayfair' | 'walden' | 'ludwig' | 'xpro2'
  // ── Beauty & Face ──
  | 'renegade' | 'cinema7' | 'boho' | 'pinkpreset' | 'moody'
  | 'ciaobella' | 'almondmilk' | 'honeysuckle' | 'topmodel' | 'cuteness'
  // ── Aesthetic & Viral ──
  | 'beautymix' | 'lvshine' | 'blush' | 'milkthree' | 'kirakira'
  // ── Legacy (keep for safety) ──
  | 'mirror';

export interface FilterConfig {
  id: FilterType;
  label: string;
  cssFilter: string;
  canvasTransform?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export interface Photo {
  id: string;
  dataUrl: string;
  filter: FilterType;
  timestamp: number;
  isMirror: boolean;
  width: number;
  height: number;
}

export interface PhotoStrip {
  id: string;
  dataUrl: string;
  photos: Photo[];
  timestamp: number;
  templateId: string;
}

export type CaptureMode = 'single' | 'strip' | 'gif';

export interface GifRecording {
  id: string;
  dataUrl: string;
  frameCount: number;
  durationMs: number;
  timestamp: number;
  width: number;
  height: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  label: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export type StickerTemplate = Omit<Sticker, 'x' | 'y' | 'id'>;

export interface CameraState {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  stream: MediaStream | null;
  facingMode: 'user' | 'environment';
}

export interface CountdownState {
  isActive: boolean;
  count: number;
  duration: number;
}

// Strip template definition
export interface StripTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Renders photos onto a canvas and returns the final dataUrl */
  render: (photos: Photo[]) => Promise<string>;
}