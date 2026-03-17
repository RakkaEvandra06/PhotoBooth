// src/components/ControlBar.tsx

import React from 'react';
import { FlipHorizontal, Timer, Film, Camera, SwitchCamera, Images, Smile, Clapperboard } from 'lucide-react';
import type { CaptureMode } from '../types';

interface Props {
  captureMode: CaptureMode;
  onSetMode: (mode: CaptureMode) => void;
  isMirror: boolean;
  onToggleMirror: () => void;
  countdownEnabled: boolean;
  onToggleCountdown: () => void;
  countdownDuration: number;
  onSetCountdownDuration: (n: number) => void;
  canSwitchCamera: boolean;
  onSwitchCamera: () => void;
  onOpenGallery: () => void;
  photoCount: number;
  onToggleStickers: () => void;
  showStickers: boolean;
  /** compact=true: condensed layout for landscape phone */
  compact?: boolean;
}

export const ControlBar: React.FC<Props> = ({
  captureMode,
  onSetMode,
  isMirror,
  onToggleMirror,
  countdownEnabled,
  onToggleCountdown,
  countdownDuration,
  onSetCountdownDuration,
  canSwitchCamera,
  onSwitchCamera,
  onOpenGallery,
  photoCount,
  onToggleStickers,
  showStickers,
  compact = false,
}) => {
  const btnSize  = compact ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = compact ? 13 : 14;

  return (
    <div className={`flex items-center justify-between gap-2 w-full ${compact ? '' : ''}`}>
      {/* Left: mirror + countdown */}
      <div className="flex items-center gap-1">
        <ControlButton
          active={isMirror}
          onClick={onToggleMirror}
          title="Mirror"
          icon={<FlipHorizontal size={iconSize} />}
          size={btnSize}
        />
        {captureMode !== 'gif' && (
          <ControlButton
            active={countdownEnabled}
            onClick={onToggleCountdown}
            title="Countdown"
            icon={<Timer size={iconSize} />}
            size={btnSize}
          />
        )}
        {countdownEnabled && captureMode !== 'gif' && !compact && (
          <div className="flex items-center gap-0.5 ml-1">
            {[3, 5].map(n => (
              <button
                key={n}
                onClick={() => onSetCountdownDuration(n)}
                className={`w-7 h-7 rounded font-mono text-xs transition-all ${
                  countdownDuration === n
                    ? 'bg-booth-accent text-white'
                    : 'text-booth-muted hover:text-booth-text bg-booth-border'
                }`}
              >
                {n}s
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center: mode selector */}
      <div className="flex items-center bg-booth-border rounded-lg p-0.5 gap-0.5">
        <ModeButton
          active={captureMode === 'single'}
          onClick={() => onSetMode('single')}
          icon={<Camera size={compact ? 11 : 13} />}
          label={compact ? '' : 'Shot'}
          compact={compact}
        />
        <ModeButton
          active={captureMode === 'strip'}
          onClick={() => onSetMode('strip')}
          icon={<Film size={compact ? 11 : 13} />}
          label={compact ? '' : 'Strip'}
          compact={compact}
        />
        <ModeButton
          active={captureMode === 'gif'}
          onClick={() => onSetMode('gif')}
          icon={<Clapperboard size={compact ? 11 : 13} />}
          label={compact ? '' : 'GIF'}
          highlight="amber"
          compact={compact}
        />
      </div>

      {/* Right: stickers + switch + gallery */}
      <div className="flex items-center gap-1">
        <ControlButton
          active={showStickers}
          onClick={onToggleStickers}
          title="Stickers"
          icon={<Smile size={iconSize} />}
          size={btnSize}
        />
        {canSwitchCamera && (
          <ControlButton
            active={false}
            onClick={onSwitchCamera}
            title="Switch"
            icon={<SwitchCamera size={iconSize} />}
            size={btnSize}
          />
        )}
        <button
          onClick={onOpenGallery}
          className={`relative flex items-center justify-center ${btnSize} rounded-lg bg-booth-border hover:bg-booth-dim text-booth-muted hover:text-booth-text transition-all`}
          title="Gallery"
        >
          <Images size={iconSize} />
          {photoCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-booth-accent text-white font-mono text-[9px] flex items-center justify-center">
              {photoCount > 9 ? '9+' : photoCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ControlButton: React.FC<{
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  size?: string;
}> = ({ active, onClick, title, icon, size = 'w-9 h-9' }) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex items-center justify-center ${size} rounded-lg transition-all ${
      active
        ? 'bg-booth-accent text-white shadow-[0_0_8px_rgba(255,60,60,0.4)]'
        : 'bg-booth-border text-booth-muted hover:text-booth-text hover:bg-booth-dim'
    }`}
  >
    {icon}
  </button>
);

const ModeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: string;
  compact?: boolean;
}> = ({ active, onClick, icon, label, highlight, compact }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 rounded-md font-mono uppercase tracking-wider transition-all ${
      compact ? 'px-2 py-1.5 text-[9px]' : 'px-2.5 py-1.5 text-[10px]'
    } ${
      active
        ? highlight === 'amber'
          ? 'bg-booth-amber text-black font-semibold'
          : 'bg-booth-accent text-white'
        : 'text-booth-muted hover:text-booth-text'
    }`}
  >
    {icon}
    {label && label}
  </button>
);