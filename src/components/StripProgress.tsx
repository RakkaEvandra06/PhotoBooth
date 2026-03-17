// src/components/StripProgress.tsx

import React from 'react';
import type { Photo } from '../types';

interface Props {
  photos: Photo[];
  total: number;
}

export const StripProgress: React.FC<Props> = ({ photos, total }) => {
  if (photos.length === 0) return null;

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 animate-slide-up">
      <div className="bg-booth-panel/90 backdrop-blur-sm border border-booth-border rounded-xl p-2 flex flex-col gap-1.5">
        <p className="font-mono text-[9px] uppercase tracking-widest text-booth-muted text-center">
          Strip {photos.length}/{total}
        </p>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`
              rounded-md overflow-hidden border transition-all duration-300
              ${i < photos.length ? 'border-booth-accent' : 'border-booth-border bg-booth-border'}
            `}
            style={{
              /*
               * Thumbnails scale with viewport width so they don't overflow
               * on very small screens (e.g. 320px wide phones).
               */
              width: 'clamp(44px, 12vw, 64px)',
              height: 'clamp(33px, 9vw, 48px)',
            }}
          >
            {photos[i] && (
              <img
                src={photos[i].dataUrl}
                alt={`Strip frame ${i + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
