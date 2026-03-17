// src/components/StripResultModal.tsx
// Shows the completed photo strip with template switcher.
// Users can switch templates and the strip re-renders live.

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, RefreshCw, Loader2 } from 'lucide-react';
import type { PhotoStrip } from '../types';
import { downloadDataUrl } from '../utils/photoUtils';
import { buildPhotoStrip } from '../utils/photoUtils';
import { STRIP_TEMPLATES } from '../utils/StripTemplates';

interface Props {
  strip: PhotoStrip;
  selectedTemplate: string;
  onSelectTemplate: (id: string) => void;
  onClose: () => void;
  onRetake: () => void;
}

export const StripResultModal: React.FC<Props> = ({
  strip,
  selectedTemplate,
  onSelectTemplate,
  onClose,
  onRetake,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(strip.dataUrl);
  const [isRendering, setIsRendering] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(selectedTemplate);

  // Re-render when template changes
  const applyTemplate = useCallback(async (templateId: string) => {
    setIsRendering(true);
    setActiveTemplate(templateId);
    try {
      const newStrip = await buildPhotoStrip(strip.photos, templateId);
      setPreviewUrl(newStrip.dataUrl);
      onSelectTemplate(templateId);
    } catch (err) {
      console.error('Template render failed:', err);
    } finally {
      setIsRendering(false);
    }
  }, [strip.photos, onSelectTemplate]);

  // On open, if template differs from strip's original, re-render
  useEffect(() => {
    if (selectedTemplate !== strip.templateId) {
      applyTemplate(selectedTemplate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentTemplateDef = STRIP_TEMPLATES.find(t => t.id === activeTemplate);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          padding: 'max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left))',
        }}
      >
        <div
          className="relative bg-booth-panel border border-booth-border rounded-2xl overflow-hidden shadow-2xl animate-strip-in pointer-events-auto flex flex-col w-full"
          style={{ maxWidth: '380px', maxHeight: 'min(92dvh, 92vh)' }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <div>
              <h2 className="font-display text-2xl text-booth-text tracking-wide">YOUR STRIP</h2>
              <p className="font-mono text-[10px] text-booth-muted uppercase tracking-widest">
                {strip.photos.length} shots · {currentTemplateDef?.name ?? 'Classic'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-booth-border text-booth-muted hover:text-booth-text transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Template picker ── */}
          <div className="px-4 pb-2 shrink-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-booth-muted mb-2">
              Choose Template
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {STRIP_TEMPLATES.map(t => {
                const isActive = activeTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    disabled={isRendering}
                    title={t.description}
                    className={`
                      flex-shrink-0 flex flex-col items-center gap-1 transition-all duration-200
                      ${isRendering ? 'opacity-50 pointer-events-none' : ''}
                    `}
                  >
                    <div
                      className={`
                        flex items-center justify-center rounded-xl border-2 transition-all duration-200
                        ${isActive
                          ? 'border-booth-accent bg-booth-accent/15 shadow-[0_0_10px_rgba(255,60,60,0.4)] scale-110'
                          : 'border-booth-border bg-booth-border/60 hover:border-booth-dim hover:scale-105'
                        }
                      `}
                      style={{ width: '44px', height: '44px' }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1 }}>{t.emoji}</span>
                    </div>
                    <span
                      className={`font-mono text-[8px] uppercase tracking-wider transition-colors text-center leading-tight ${isActive ? 'text-booth-accent' : 'text-booth-muted'}`}
                      style={{ maxWidth: '44px' }}
                    >
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Strip preview ── */}
          <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 scrollbar-thin">
            <div className="relative rounded-xl overflow-hidden border border-booth-border shadow-inner">
              <img
                src={previewUrl}
                alt="Photo strip"
                className={`w-full object-contain transition-opacity duration-300 ${isRendering ? 'opacity-30' : 'opacity-100'}`}
              />
              {/* Rendering spinner overlay */}
              {isRendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-booth-bg/60 backdrop-blur-sm">
                  <Loader2 size={32} className="text-booth-accent animate-spin mb-2" />
                  <p className="font-mono text-xs text-booth-muted uppercase tracking-wider">
                    Rendering…
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="px-4 pb-4 flex gap-3 shrink-0">
            <button
              onClick={() => downloadDataUrl(previewUrl, `lumisnap-strip-${strip.id}.png`)}
              disabled={isRendering}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-booth-accent text-white font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Download size={14} />
              Download PNG
            </button>
            <button
              onClick={onRetake}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-booth-border text-booth-muted font-mono text-xs uppercase tracking-wider hover:text-booth-text transition-colors"
              title="Retake"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
