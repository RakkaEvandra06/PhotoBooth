// src/components/FilterSelector.tsx

import React from 'react';
import type { FilterType } from '../types';
import { FILTERS } from '../utils/filters';

interface Props {
  selected: FilterType;
  onChange: (filter: FilterType) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  /** compact=true: smaller thumbnails for landscape phone layout */
  compact?: boolean;
}

export const FilterSelector: React.FC<Props> = ({ selected, onChange, videoRef: _videoRef, compact = false }) => {
  const thumbSize = compact ? 'w-9 h-9' : 'w-14 h-14';

  return (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide px-1 ${compact ? 'pb-0.5' : 'pb-1 gap-3'}`}>
      {FILTERS.map((filter) => {
        const isActive = selected === filter.id;
        return (
          <button
            key={filter.id}
            onClick={() => onChange(filter.id)}
            className="flex-shrink-0 flex flex-col items-center gap-1 group transition-all duration-200"
          >
            {/* Preview thumbnail */}
            <div
              className={`
                relative ${thumbSize} rounded-lg overflow-hidden border-2 transition-all duration-200
                ${isActive
                  ? 'border-booth-accent shadow-[0_0_12px_rgba(255,60,60,0.5)]'
                  : 'border-booth-border hover:border-booth-dim'
                }
              `}
            >
              <FilterSwatch filter={filter.id} cssFilter={filter.cssFilter} />
              {isActive && (
                <div className="absolute inset-0 ring-1 ring-inset ring-booth-accent/50 rounded-lg" />
              )}
            </div>
            {/* Label */}
            {!compact && (
              <span className={`font-mono text-[10px] tracking-widest uppercase transition-colors ${isActive ? 'text-booth-accent' : 'text-booth-muted group-hover:text-booth-text'}`}>
                {filter.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Static CSS-filtered swatch — no live video canvas needed.
 * We use a gradient background + silhouette to demonstrate the filter.
 */
const FilterSwatch: React.FC<{ filter: FilterType; cssFilter: string }> = ({ filter, cssFilter }) => {
  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
    filter: filter === 'mirror' ? undefined : cssFilter || undefined,
    transform: filter === 'mirror' ? 'scaleX(-1)' : undefined,
  };

  return (
    <div
      className="w-full h-full"
      style={{
        background: 'linear-gradient(135deg, #3a3a4a 0%, #1a1a2e 50%, #2d1b1b 100%)',
        ...style,
      }}
    >
      <div className="w-full h-full flex items-center justify-center opacity-70">
        <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
          <circle cx="20" cy="16" r="7" fill="#e8e0d0" />
          <ellipse cx="20" cy="32" rx="11" ry="7" fill="#e8e0d0" />
        </svg>
      </div>
    </div>
  );
};
