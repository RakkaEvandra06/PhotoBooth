// src/components/CaptureButton.tsx

import React from 'react';
import type { CaptureMode } from '../types';

interface Props {
  onClick: () => void;
  isCapturing: boolean;
  captureMode: CaptureMode;
  stripProgress: number;
  gifProgress: number;
  disabled: boolean;
  /** compact=true: smaller shutter button for landscape phone layout */
  compact?: boolean;
}

const STRIP_COUNT = 4;

export const CaptureButton: React.FC<Props> = ({
  onClick,
  isCapturing,
  captureMode,
  stripProgress,
  gifProgress,
  disabled,
  compact = false,
}) => {
  const isStrip = captureMode === 'strip';
  const isGif   = captureMode === 'gif';

  const buttonColor = isGif
    ? isCapturing
      ? 'bg-booth-amber'
      : 'bg-booth-text group-hover:bg-booth-amber group-active:scale-90'
    : isCapturing
    ? 'bg-booth-amber scale-90'
    : 'bg-booth-text group-hover:bg-booth-accent group-active:scale-90';

  const ringColor = isGif
    ? 'border-booth-amber'
    : 'border-booth-text group-hover:border-booth-accent';

  // Sizes
  const outerSize  = compact ? 'w-14 h-14' : 'w-20 h-20';
  const innerSize  = compact ? 'w-10 h-10' : 'w-14 h-14';
  const dotSize    = compact ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const ringWidth  = compact ? 'border-[3px]' : 'border-4';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Strip progress dots */}
      {isStrip && (
        <div className="flex gap-1.5 items-center" style={{ height: compact ? '14px' : '20px' }}>
          {Array.from({ length: STRIP_COUNT }).map((_, i) => (
            <div
              key={i}
              className={`${dotSize} rounded-full transition-all duration-300 ${
                i < stripProgress
                  ? 'bg-booth-accent scale-125'
                  : i === stripProgress && isCapturing
                  ? 'bg-booth-amber animate-pulse scale-110'
                  : 'bg-booth-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* GIF progress ring */}
      {isGif && isCapturing && (
        <div className={`relative ${compact ? 'w-5 h-5' : 'w-6 h-6'}`}>
          <svg viewBox="0 0 24 24" className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} -rotate-90`}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="#1e1e1e" strokeWidth="2" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="#ffb800" strokeWidth="2"
              strokeDasharray={`${gifProgress * 0.628} 62.8`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[7px] text-booth-amber">
            {gifProgress}%
          </span>
        </div>
      )}

      {/* Main shutter button */}
      <button
        onClick={onClick}
        disabled={disabled || isCapturing}
        className="relative group focus:outline-none"
        aria-label="Capture"
      >
        <div className={`${outerSize} rounded-full ${ringWidth} flex items-center justify-center transition-all duration-200 ${
          disabled || isCapturing
            ? 'border-booth-dim cursor-not-allowed'
            : `${ringColor} cursor-pointer`
        }`}>
          <div className={`${innerSize} rounded-full transition-all duration-200 ${
            disabled || isCapturing ? 'bg-booth-dim' : buttonColor
          }`}>
            {isGif && !isCapturing && (
              <div className="w-full h-full flex items-center justify-center">
                <span className={`font-display text-booth-bg ${compact ? 'text-[10px]' : 'text-sm'}`}>GIF</span>
              </div>
            )}
          </div>
        </div>
        {isCapturing && (
          <div className={`absolute inset-0 rounded-full border-2 animate-pulse-ring ${isGif ? 'border-booth-amber' : 'border-booth-accent'}`} />
        )}
      </button>

      {!compact && (
        <span className="font-mono text-[10px] tracking-widest uppercase text-booth-muted">
          {isCapturing
            ? isStrip ? `Shot ${stripProgress + 1}/${STRIP_COUNT}` : isGif ? 'Recording…' : 'Processing…'
            : isStrip ? `Strip · ${STRIP_COUNT} shots` : isGif ? 'Record 3s GIF' : 'Single shot'}
        </span>
      )}
    </div>
  );
};
