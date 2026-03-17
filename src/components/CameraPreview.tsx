// src/components/CameraPreview.tsx

import React from 'react';
import type { FilterType } from '../types';
import { getCssFilter, getCssTransform } from '../utils/filters';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  filter: FilterType;
  isMirror: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export const CameraPreview: React.FC<Props> = ({
  videoRef,
  filter,
  isMirror,
  isReady,
  isLoading,
  error,
}) => {
  const cssFilter    = getCssFilter(filter, isMirror);
  const cssTransform = getCssTransform(filter, isMirror);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0a0a0a' }}>

      {/* Video — fills container, object-cover preserves aspect ratio */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter:    cssFilter    || undefined,
          transform: cssTransform || undefined,
          display:   isReady      ? 'block' : 'none',
          background: '#000',
        }}
      />

      {/* Soft vignette — matches reference: subtle dark at edges */}
      {isReady && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,0.38) 100%)',
          }}
        />
      )}

      {/* Loading */}
      {isLoading && !isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-booth-bg z-20">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-booth-border" />
            <div className="absolute inset-0 rounded-full border-2 border-t-booth-accent border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="mt-4 font-mono text-xs text-booth-muted tracking-widest uppercase">
            Initializing camera
          </p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-booth-bg z-20 p-6">
          <div className="text-booth-accent text-4xl mb-3">⊘</div>
          <p className="font-display text-2xl text-booth-text mb-2">NO SIGNAL</p>
          <p className="font-mono text-xs text-booth-muted text-center max-w-xs">{error}</p>
          <p className="font-mono text-xs text-booth-dim mt-3 text-center">
            Please allow camera access and refresh
          </p>
        </div>
      )}

      {/* Idle */}
      {!isLoading && !isReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-booth-bg z-20">
          <div className="font-display text-6xl text-booth-dim mb-2">READY</div>
          <p className="font-mono text-xs text-booth-muted tracking-widest">AWAITING INPUT</p>
        </div>
      )}
    </div>
  );
};