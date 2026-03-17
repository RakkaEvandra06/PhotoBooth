// src/components/GifRecordingOverlay.tsx

import React from 'react';
import type { GifRecorderState } from '../hooks/useGifRecorder';

interface Props {
  state: GifRecorderState;
  onCancel: () => void;
}

export const GifRecordingOverlay: React.FC<Props> = ({ state, onCancel }) => {
  if (!state.isRecording && !state.isEncoding) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Pulsing red border while recording */}
      {state.isRecording && (
        <div className="absolute inset-0 border-4 border-booth-accent rounded-2xl animate-pulse" />
      )}

      {/* REC indicator */}
      {state.isRecording && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-booth-accent animate-pulse" />
          <span className="font-mono text-xs text-white uppercase tracking-wider">REC GIF</span>
          <button
            onClick={onCancel}
            className="ml-1 text-booth-muted hover:text-white transition-colors font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Progress bar — sits at the very bottom of the camera viewport */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-booth-border/60 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${state.isEncoding ? 'bg-booth-amber animate-pulse' : 'bg-booth-accent'}`}
          style={{ width: `${state.progress}%` }}
        />
      </div>

      {/* Encoding overlay */}
      {state.isEncoding && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-booth-border" />
            <div className="absolute inset-0 rounded-full border-2 border-t-booth-amber border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-booth-amber">GIF</span>
            </div>
          </div>
          <p className="font-display text-xl text-booth-text tracking-wide">ENCODING</p>
          <p className="font-mono text-xs text-booth-muted mt-1">Building your animated GIF…</p>
        </div>
      )}
    </div>
  );
};
