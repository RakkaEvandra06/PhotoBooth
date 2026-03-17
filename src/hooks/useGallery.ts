// src/hooks/useGallery.ts

import { useState, useCallback, useEffect } from 'react';
import { storageService } from '../services/storageService';
import type { Photo, PhotoStrip, GifRecording } from '../types';

export function useGallery() {
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [strips, setStrips]   = useState<PhotoStrip[]>([]);
  const [gifs,   setGifs]     = useState<GifRecording[]>([]);

  const refresh = useCallback(() => {
    setPhotos(storageService.getPhotos());
    setStrips(storageService.getStrips());
    setGifs(storageService.getGifs());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addPhoto = useCallback((photo: Photo) => {
    storageService.savePhoto(photo);
    setPhotos(storageService.getPhotos());
  }, []);

  const addStrip = useCallback((strip: PhotoStrip) => {
    storageService.saveStrip(strip);
    setStrips(storageService.getStrips());
  }, []);

  const addGif = useCallback((gif: GifRecording) => {
    storageService.saveGif(gif);
    setGifs(storageService.getGifs());
  }, []);

  const deletePhoto = useCallback((id: string) => {
    storageService.deletePhoto(id);
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const deleteStrip = useCallback((id: string) => {
    storageService.deleteStrip(id);
    setStrips(prev => prev.filter(s => s.id !== id));
  }, []);

  const deleteGif = useCallback((id: string) => {
    storageService.deleteGif(id);
    setGifs(prev => prev.filter(g => g.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    storageService.clearAll();
    setPhotos([]);
    setStrips([]);
    setGifs([]);
  }, []);

  return {
    photos, strips, gifs,
    addPhoto, addStrip, addGif,
    deletePhoto, deleteStrip, deleteGif,
    clearAll,
  };
}
