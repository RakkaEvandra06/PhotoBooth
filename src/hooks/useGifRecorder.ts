// src/hooks/useGifRecorder.ts

import { useState, useRef, useCallback } from 'react';
import { encodeGif, gifToDataUrl } from '../utils/gifEncoder';
import type { GifRecording } from '../types';
import { generateId } from '../utils/photoUtils';

const GIF_FPS = 8;          // frames per second to capture
const GIF_DURATION_MS = 3000; // 3 seconds
const GIF_SCALE = 0.35;      // scale down to keep file small

export interface GifRecorderState {
  isRecording: boolean;
  isEncoding: boolean;
  progress: number; // 0–100
  error: string | null;
}

export function useGifRecorder() {
  const [state, setState] = useState<GifRecorderState>({
    isRecording: false,
    isEncoding: false,
    progress: 0,
    error: null,
  });

  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const framesRef = useRef<ImageData[]>([]);
  const startTimeRef = useRef<number>(0);

  const record = useCallback(
    (video: HTMLVideoElement): Promise<GifRecording> => {
      return new Promise((resolve, reject) => {
        framesRef.current = [];

        const srcW = video.videoWidth || 640;
        const srcH = video.videoHeight || 480;
        const w = Math.round(srcW * GIF_SCALE);
        const h = Math.round(srcH * GIF_SCALE);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        const totalFrames = Math.round((GIF_DURATION_MS / 1000) * GIF_FPS);
        const intervalMs = 1000 / GIF_FPS;

        setState({ isRecording: true, isEncoding: false, progress: 0, error: null });
        startTimeRef.current = Date.now();

        frameIntervalRef.current = setInterval(() => {
          ctx.drawImage(video, 0, 0, w, h);
          framesRef.current.push(ctx.getImageData(0, 0, w, h));

          const progress = Math.min(
            100,
            Math.round((framesRef.current.length / totalFrames) * 100)
          );
          setState(s => ({ ...s, progress }));

          if (framesRef.current.length >= totalFrames) {
            clearInterval(frameIntervalRef.current!);
            setState({ isRecording: false, isEncoding: true, progress: 0, error: null });

            // Encode async via setTimeout to keep UI responsive
            setTimeout(() => {
              try {
                const gif = encodeGif(framesRef.current, intervalMs);
                const dataUrl = gifToDataUrl(gif);

                const recording: GifRecording = {
                  id: generateId(),
                  dataUrl,
                  frameCount: framesRef.current.length,
                  durationMs: GIF_DURATION_MS,
                  timestamp: Date.now(),
                  width: w,
                  height: h,
                };

                setState({ isRecording: false, isEncoding: false, progress: 100, error: null });
                resolve(recording);
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'GIF encoding failed';
                setState({ isRecording: false, isEncoding: false, progress: 0, error: msg });
                reject(new Error(msg));
              }
            }, 16);
          }
        }, intervalMs);
      });
    },
    []
  );

  const cancel = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    framesRef.current = [];
    setState({ isRecording: false, isEncoding: false, progress: 0, error: null });
  }, []);

  return { state, record, cancel };
}
