// src/components/CountdownOverlay.tsx

import React from 'react';
import type { CountdownState } from '../types';

interface Props {
  countdown: CountdownState;
}

export const CountdownOverlay: React.FC<Props> = ({ countdown }) => {
  if (!countdown.isActive) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Count number — uses clamp so it scales with viewport */}
      <div className="relative flex items-center justify-center">
        <div
          key={countdown.count}
          className="absolute rounded-full border-2 border-booth-accent animate-pulse-ring"
          style={{ width: 'clamp(100px, 30vw, 160px)', height: 'clamp(100px, 30vw, 160px)' }}
        />
        <div
          key={`${countdown.count}-2`}
          className="absolute rounded-full border border-booth-accent animate-pulse-ring"
          style={{ width: 'clamp(100px, 30vw, 160px)', height: 'clamp(100px, 30vw, 160px)', animationDelay: '0.3s' }}
        />
        <div
          key={`num-${countdown.count}`}
          className="animate-count-pop relative z-10 rounded-full bg-booth-accent flex items-center justify-center"
          style={{ width: 'clamp(90px, 28vw, 144px)', height: 'clamp(90px, 28vw, 144px)' }}
        >
          <span
            className="font-display text-white leading-none"
            style={{ fontSize: 'clamp(48px, 14vw, 80px)' }}
          >
            {countdown.count}
          </span>
        </div>
      </div>

      {/* SMILE text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <span
          className="font-display text-white tracking-widest drop-shadow-lg"
          style={{ fontSize: 'clamp(18px, 6vw, 30px)' }}
        >
          SMILE!
        </span>
      </div>
    </div>
  );
};
