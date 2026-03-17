// src/components/Header.tsx

import React from 'react';

interface Props {
  /** compact=true: smaller text + padding for landscape phone layout */
  compact?: boolean;
}

export const Header: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-booth-accent flex items-center justify-center shadow-[0_0_8px_rgba(255,60,60,0.6)]">
            <svg viewBox="0 0 20 20" className="w-3 h-3 fill-white">
              <circle cx="10" cy="10" r="3.5" />
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" />
            </svg>
          </div>
          <span className="font-display text-sm text-booth-text tracking-widest">LUMISNAP</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-booth-accent animate-pulse" />
          <span className="font-mono text-[8px] text-booth-muted uppercase tracking-widest">Live</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-booth-accent flex items-center justify-center shadow-[0_0_12px_rgba(255,60,60,0.6)]">
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white">
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z" />
          </svg>
        </div>
        <span className="font-display text-xl text-booth-text tracking-widest">LUMISNAP</span>
      </div>
      {/* Status indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-booth-accent animate-pulse" />
          <span className="font-mono text-[9px] text-booth-muted uppercase tracking-widest">Live</span>
        </div>
      </div>
    </div>
  );
};
