// src/components/FilterSelector.tsx

import React from 'react';
import type { FilterType } from '../types';
import { FILTERS } from '../utils/filters';

interface Props {
  selected: FilterType;
  onChange: (filter: FilterType) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  compact?: boolean;
}

// Filter categories for section headers
const CATEGORIES = [
  { label: 'Normal',    ids: ['none'] },
  { label: 'Instagram', ids: ['clarendon','gingham','juno','lark','valencia','sierra','mayfair','walden','ludwig','xpro2'] },
  { label: 'Beauty',    ids: ['renegade','cinema7','boho','pinkpreset','moody','ciaobella','almondmilk','honeysuckle','topmodel','cuteness'] },
  { label: 'Aesthetic', ids: ['beautymix','lvshine','blush','milkthree','kirakira'] },
  { label: 'Mirror',    ids: ['mirror'] },
];

export const FilterSelector: React.FC<Props> = ({ selected, onChange, videoRef: _videoRef, compact = false }) => {
  const thumbSize = compact ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className={`flex items-end gap-0 ${compact ? 'pb-0.5' : 'pb-0.5'}`} style={{ width: 'max-content', paddingLeft: '4px', paddingRight: '4px' }}>
        {CATEGORIES.map((cat, ci) => {
          const filters = FILTERS.filter(f => cat.ids.includes(f.id));
          if (!filters.length) return null;
          return (
            <div key={cat.label} className={`flex items-end ${ci > 0 ? 'ml-1 pl-1 border-l border-booth-border/40' : ''}`}>
              {!compact && (
                <div className="flex flex-col justify-end mr-1 pb-1" style={{ minWidth: '20px' }}>
                  <span className="font-mono text-[7px] text-booth-dim uppercase tracking-widest"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1 }}>
                    {cat.label}
                  </span>
                </div>
              )}
              <div className={`flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
                {filters.map(filter => {
                  const isActive = selected === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => onChange(filter.id as FilterType)}
                      className="flex-shrink-0 flex flex-col items-center gap-0.5 group transition-all duration-200"
                    >
                      <div className={`
                        relative ${thumbSize} rounded-lg overflow-hidden border-2 transition-all duration-200
                        ${isActive
                          ? 'border-booth-accent shadow-[0_0_10px_rgba(255,60,60,0.5)] scale-110'
                          : 'border-booth-border hover:border-booth-dim hover:scale-105'
                        }
                      `}>
                        <FilterSwatch filterId={filter.id} cssFilter={filter.cssFilter} />
                        {isActive && (
                          <div className="absolute inset-0 ring-1 ring-inset ring-booth-accent/50 rounded-lg" />
                        )}
                      </div>
                      {!compact && (
                        <span className={`font-mono text-[8px] tracking-wide uppercase transition-colors text-center leading-tight max-w-[48px] truncate
                          ${isActive ? 'text-booth-accent' : 'text-booth-muted group-hover:text-booth-text'}`}>
                          {filter.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Swatch — shows a gradient preview with the CSS filter applied ─────────────
const FilterSwatch: React.FC<{ filterId: string; cssFilter: string }> = ({ filterId, cssFilter }) => {
  return (
    <div
      className="w-full h-full"
      style={{
        background: 'linear-gradient(135deg, #5a4060 0%, #2a1a3e 35%, #1a2a3a 65%, #3a2010 100%)',
        filter: filterId === 'mirror' ? undefined : cssFilter || undefined,
        transform: filterId === 'mirror' ? 'scaleX(-1)' : undefined,
      }}
    >
      <div className="w-full h-full flex items-center justify-center" style={{ opacity: 0.75 }}>
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
          <circle cx="20" cy="16" r="7" fill="#e8d8c8" />
          <ellipse cx="20" cy="32" rx="11" ry="7" fill="#e8d8c8" />
        </svg>
      </div>
    </div>
  );
};