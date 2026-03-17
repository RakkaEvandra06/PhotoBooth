// src/components/GifResultModal.tsx

import React from 'react';
import { Download, X, RefreshCw } from 'lucide-react';
import type { GifRecording } from '../types';
import { downloadDataUrl } from '../utils/photoUtils';

interface Props {
  gif: GifRecording;
  onClose: () => void;
  onRetake: () => void;
}

export const GifResultModal: React.FC<Props> = ({ gif, onClose, onRetake }) => {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          padding: 'max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left))',
        }}
      >
        <div
          className="relative bg-booth-panel border border-booth-border rounded-2xl overflow-hidden shadow-2xl animate-strip-in pointer-events-auto flex flex-col w-full"
          style={{ maxWidth: '360px', maxHeight: 'min(90dvh, 90vh)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl text-booth-text tracking-wide">YOUR GIF</h2>
                <span className="px-2 py-0.5 rounded-full bg-booth-amber/20 border border-booth-amber/40 font-mono text-[9px] uppercase tracking-wider text-booth-amber">Animated</span>
              </div>
              <p className="font-mono text-[10px] text-booth-muted mt-0.5">
                {gif.frameCount} frames · {(gif.durationMs / 1000).toFixed(1)}s · {gif.width}×{gif.height}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-booth-border text-booth-muted hover:text-booth-text transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* GIF preview — scrollable container */}
          <div className="flex-1 overflow-y-auto px-5 pb-3 min-h-0 scrollbar-thin">
            <div className="rounded-xl overflow-hidden border border-booth-border bg-[#0a0a0a]">
              <img src={gif.dataUrl} alt="Animated GIF preview" className="w-full object-contain" style={{ imageRendering: 'auto' }} />
            </div>
            <p className="font-mono text-[10px] text-booth-dim text-center mt-2">
              ~{Math.round(gif.dataUrl.length * 0.75 / 1024)} KB · GIF89a format
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex gap-3 shrink-0">
            <button
              onClick={() => downloadDataUrl(gif.dataUrl, `lumisnap-${gif.id}.gif`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-booth-amber text-black font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity font-semibold"
            >
              <Download size={14} />Download GIF
            </button>
            <button
              onClick={onRetake}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-booth-border text-booth-muted font-mono text-xs uppercase tracking-wider hover:text-booth-text transition-colors"
              title="Record again"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
