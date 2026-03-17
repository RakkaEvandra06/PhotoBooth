// src/services/storageService.ts

import type { Photo, PhotoStrip, GifRecording } from '../types';

const PHOTOS_KEY = 'lumisnap:photos';
const STRIPS_KEY = 'lumisnap:strips';
const GIFS_KEY   = 'lumisnap:gifs';

function safeSave(key: string, data: unknown[], maxFull: number, maxFallback: number): void {
  try {
    localStorage.setItem(key, JSON.stringify(data.slice(0, maxFull)));
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(data.slice(0, maxFallback)));
    } catch {
      // storage completely full — skip silently
    }
  }
}

function safeLoad<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export const storageService = {
  // ── Photos ────────────────────────────────────────────────────────────────
  savePhoto(photo: Photo): void {
    const list = this.getPhotos();
    list.unshift(photo);
    safeSave(PHOTOS_KEY, list, 50, 20);
  },
  getPhotos(): Photo[] { return safeLoad<Photo>(PHOTOS_KEY); },
  deletePhoto(id: string): void {
    safeSave(PHOTOS_KEY, this.getPhotos().filter(p => p.id !== id), 50, 50);
  },

  // ── Strips ────────────────────────────────────────────────────────────────
  saveStrip(strip: PhotoStrip): void {
    const list = this.getStrips();
    list.unshift(strip);
    safeSave(STRIPS_KEY, list, 20, 5);
  },
  getStrips(): PhotoStrip[] { return safeLoad<PhotoStrip>(STRIPS_KEY); },
  deleteStrip(id: string): void {
    safeSave(STRIPS_KEY, this.getStrips().filter(s => s.id !== id), 20, 20);
  },

  // ── GIFs ──────────────────────────────────────────────────────────────────
  saveGif(gif: GifRecording): void {
    const list = this.getGifs();
    list.unshift(gif);
    safeSave(GIFS_KEY, list, 10, 3);
  },
  getGifs(): GifRecording[] { return safeLoad<GifRecording>(GIFS_KEY); },
  deleteGif(id: string): void {
    safeSave(GIFS_KEY, this.getGifs().filter(g => g.id !== id), 10, 10);
  },

  // ── Clear all ─────────────────────────────────────────────────────────────
  clearAll(): void {
    localStorage.removeItem(PHOTOS_KEY);
    localStorage.removeItem(STRIPS_KEY);
    localStorage.removeItem(GIFS_KEY);
  },
};
