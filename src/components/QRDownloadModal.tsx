// src/components/QRDownloadModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { generateQR, qrToSvg } from '../utils/qrCode';

interface Props {
  dataUrl: string;
  title?: string;
  onClose: () => void;
}

export const QRDownloadModal: React.FC<Props> = ({ dataUrl, title = 'photo', onClose }) => {
  const [qrSvg, setQrSvg]     = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!dataUrl) { setQrSvg(null); return; }
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D not available');
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const thumb = canvas.toDataURL('image/jpeg', 0.3);
        const payload = thumb.slice('data:image/jpeg;base64,'.length, 'data:image/jpeg;base64,'.length + 200);
        const matrix = generateQR(payload);
        setQrSvg(matrix ? qrToSvg(matrix, 180, '#e8e0d0', '#111111') : null);
      } catch { setQrSvg(null); }
    };
    img.onerror = () => setQrSvg(null);
    return () => setQrSvg(null);
  }, [dataUrl]);

  useEffect(() => {
    if (!dataUrl) { setBlobUrl(null); return; }
    try {
      const binary = atob(dataUrl.split(',')[1]);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      const blob = new Blob([arr], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch { setBlobUrl(null); }
  }, [dataUrl]);

  const instructionMsg = 'Open LumiSnap on your phone and sync your gallery!';
  const instructionMatrix = generateQR(instructionMsg);
  const instructionQr = instructionMatrix ? qrToSvg(instructionMatrix, 180, '#e8e0d0', '#111111') : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        style={{
          padding: 'max(1.5rem, env(safe-area-inset-top)) max(1.5rem, env(safe-area-inset-right)) max(1.5rem, env(safe-area-inset-bottom)) max(1.5rem, env(safe-area-inset-left))',
        }}
      >
        <div
          className="bg-booth-panel border border-booth-border rounded-2xl overflow-hidden shadow-2xl pointer-events-auto animate-strip-in w-full"
          style={{ maxWidth: 320, maxHeight: 'min(90dvh, 90vh)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="font-display text-xl text-booth-text tracking-wide">SCAN TO SAVE</h2>
              <p className="font-mono text-[10px] text-booth-muted mt-0.5">{title}</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-booth-border text-booth-muted hover:text-booth-text transition-colors"
              aria-label="Close" type="button">
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 pb-5 scrollbar-thin">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-booth-border">
                <img src={dataUrl} alt={title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="rounded-xl overflow-hidden p-3 bg-[#111111] border border-booth-border"
                  dangerouslySetInnerHTML={{ __html: qrSvg ?? instructionQr ?? '' }}
                />
                <p className="font-mono text-[10px] text-booth-muted text-center max-w-[220px]">
                  Scan to open LumiSnap on your phone, or use the download button below
                </p>
              </div>
              <a
                href={blobUrl ?? dataUrl}
                download={`lumisnap-${title}.png`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-booth-accent text-white font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                ↓ Download on this device
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
