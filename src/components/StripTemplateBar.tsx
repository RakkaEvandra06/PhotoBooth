// src/components/StripTemplateBar.tsx
// Template picker — compact trigger bar + full-screen modal overlay.
// The trigger bar shows the currently selected template + a button to open the modal.
// The modal shows all templates in a 2-column grid with mini previews.
// This prevents the picker from blocking the camera or capture button.

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ChevronRight, Check } from 'lucide-react';
import { STRIP_TEMPLATES } from '../utils/StripTemplates';
import type { Photo } from '../types';

interface Props {
  selectedTemplate: string;
  onSelect: (id: string) => void;
  compact?: boolean;
  /** Preview photos for thumbnail rendering (optional) */
  previewPhotos?: Photo[];
}

export const StripTemplateBar: React.FC<Props> = ({
  selectedTemplate,
  onSelect,
  compact = false,
  previewPhotos,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const current = STRIP_TEMPLATES.find(t => t.id === selectedTemplate) ?? STRIP_TEMPLATES[0];

  const handleSelect = (id: string) => {
    onSelect(id);
    setModalOpen(false);
  };

  return (
    <>
      {/* ── Compact trigger bar ── */}
      <button
        onClick={() => setModalOpen(true)}
        className={`
          flex items-center justify-between w-full rounded-xl border border-booth-border
          bg-booth-border/60 hover:bg-booth-dim transition-all duration-200
          ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}
        `}
      >
        <div className="flex items-center gap-2.5">
          {/* Emoji badge */}
          <div className={`
            flex items-center justify-center rounded-lg bg-booth-bg border border-booth-accent/40
            ${compact ? 'w-7 h-7' : 'w-9 h-9'}
          `}>
            <span style={{ fontSize: compact ? '14px' : '18px', lineHeight: 1 }}>
              {current.emoji}
            </span>
          </div>
          <div className="text-left">
            <p className={`font-mono uppercase tracking-wider text-booth-text ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
              {current.name}
            </p>
            <p className="font-mono text-[9px] text-booth-muted tracking-wide">
              {current.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-booth-muted uppercase tracking-wider hidden sm:block">
            Change
          </span>
          <ChevronRight size={14} className="text-booth-muted" />
        </div>
      </button>

      {/* ── Full-screen template picker modal ── */}
      {modalOpen && (
        <TemplatePickerModal
          selectedTemplate={selectedTemplate}
          onSelect={handleSelect}
          onClose={() => setModalOpen(false)}
          previewPhotos={previewPhotos}
        />
      )}
    </>
  );
};

// ─── Modal component ───────────────────────────────────────────────────────────

interface ModalProps {
  selectedTemplate: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  previewPhotos?: Photo[];
}

const TemplatePickerModal: React.FC<ModalProps> = ({
  selectedTemplate,
  onSelect,
  onClose,
  previewPhotos,
}) => {
  // Trap scroll on body while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel — centered on desktop, bottom sheet on mobile */}
      <div
        className="fixed bottom-0 z-[51] flex flex-col bg-booth-panel border-t border-booth-border rounded-t-2xl animate-slide-up"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '480px',
          maxHeight: 'min(88dvh, 88vh)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + close row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <div className="flex-1 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-booth-dim" />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-booth-border hover:bg-booth-dim text-booth-muted hover:text-booth-text transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Template grid — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-3 scrollbar-thin">
          <div className="grid grid-cols-2 gap-2.5">
            {STRIP_TEMPLATES.map(t => {
              const isActive = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelect(t.id)}
                  className={`
                    relative flex flex-col rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left
                    ${isActive
                      ? 'border-booth-accent shadow-[0_0_16px_rgba(255,60,60,0.35)] scale-[1.02]'
                      : 'border-booth-border hover:border-booth-dim hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Mini strip preview canvas */}
                  <div className="w-full bg-booth-bg" style={{ aspectRatio: '1/1.8' }}>
                    <TemplateThumbnail
                      template={t}
                      photos={previewPhotos}
                      isActive={isActive}
                    />
                  </div>

                  {/* Label footer */}
                  <div className={`
                    px-2 py-2 shrink-0 flex items-center justify-between
                    ${isActive ? 'bg-booth-accent/10' : 'bg-booth-border/50'}
                  `}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span style={{ fontSize: '13px', lineHeight: 1, flexShrink: 0 }}>{t.emoji}</span>
                      <div className="min-w-0">
                        <p className={`font-mono text-[10px] uppercase tracking-wider font-medium truncate ${isActive ? 'text-booth-accent' : 'text-booth-text'}`}>
                          {t.name}
                        </p>
                        <p className="font-mono text-[8px] text-booth-muted leading-tight truncate">
                          {t.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-booth-accent flex items-center justify-center shrink-0 ml-1">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// ─── Per-template thumbnail ────────────────────────────────────────────────────

interface ThumbProps {
  template: typeof STRIP_TEMPLATES[0];
  photos?: Photo[];
  isActive: boolean;
}

const TemplateThumbnail: React.FC<ThumbProps> = ({ template, photos, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const render = async () => {
      try {
        // Use real photos if available, else generate placeholder photos
        const sourcePhotos: Photo[] = photos && photos.length >= 4
          ? photos.slice(0, 4)
          : Array.from({ length: 4 }, (_, i) => makePlaceholderPhoto(i));

        const dataUrl = await template.render(sourcePhotos);
        if (cancelled) return;

        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
          setRendered(true);
        };
        img.src = dataUrl;
      } catch {
        // Render failed — show fallback
      }
    };

    render();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
        style={{ display: rendered ? 'block' : 'none', imageRendering: 'auto' }}
      />
      {/* Loading placeholder */}
      {!rendered && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-booth-bg/80">
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{template.emoji}</span>
          <div className="w-5 h-5 border-2 border-booth-border border-t-booth-accent rounded-full animate-spin" />
        </div>
      )}
      {/* Active overlay tint */}
      {isActive && rendered && (
        <div className="absolute inset-0 bg-booth-accent/8 pointer-events-none" />
      )}
    </div>
  );
};

// ─── Placeholder photo generator ──────────────────────────────────────────────
// Creates a small placeholder canvas image for template thumbnail previews

function makePlaceholderPhoto(index: number): Photo {
  const w = 320, h = 240;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Gradient placeholder backgrounds (different per frame)
  const gradients: [string, string][] = [
    ['#1a1a2e', '#16213e'],
    ['#16213e', '#0f3460'],
    ['#0f3460', '#533483'],
    ['#533483', '#e94560'],
  ];
  const [c1, c2] = gradients[index % gradients.length];
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Silhouette person icon
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(w/2, h/2 - 30, 38, 0, Math.PI * 2); // head
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w/2, h/2 + 50, 55, 40, 0, 0, Math.PI * 2); // body
  ctx.fill();

  // Frame label
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`FRAME ${index + 1}`, w/2, h - 12);

  return {
    id: `placeholder-${index}`,
    dataUrl: canvas.toDataURL('image/jpeg', 0.8),
    filter: 'none',
    timestamp: Date.now(),
    isMirror: false,
    width: w,
    height: h,
  };
}