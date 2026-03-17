// src/components/GalleryDrawer.tsx
// Responsive: full-screen on small phones, max 85vh on tall devices

import React, { useState } from 'react';
import { X, Download, Trash2, Film, Camera, ChevronDown, Clapperboard, QrCode } from 'lucide-react';
import type { Photo, PhotoStrip, GifRecording } from '../types';
import { downloadDataUrl, formatTimestamp } from '../utils/photoUtils';
import { QRDownloadModal } from './QRDownloadModal';

interface Props {
  photos:        Photo[];
  strips:        PhotoStrip[];
  gifs:          GifRecording[];
  onDeletePhoto: (id: string) => void;
  onDeleteStrip: (id: string) => void;
  onDeleteGif:   (id: string) => void;
  onClearAll:    () => void;
  onClose:       () => void;
}

type Tab = 'photos' | 'strips' | 'gifs';

export const GalleryDrawer: React.FC<Props> = ({
  photos, strips, gifs,
  onDeletePhoto, onDeleteStrip, onDeleteGif,
  onClearAll, onClose,
}) => {
  const [tab, setTab]                   = useState<Tab>('photos');
  const [confirmClear, setConfirmClear] = useState(false);
  const [lightbox, setLightbox]         = useState<{ src: string; title: string; ext: string } | null>(null);
  const [qrItem, setQrItem]             = useState<{ src: string; title: string } | null>(null);

  const totalCount = photos.length + strips.length + gifs.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer — max-h uses dvh so it never overflows below the address bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up flex flex-col bg-booth-panel border-t border-booth-border rounded-t-2xl overflow-hidden"
        style={{
          maxHeight: 'min(85dvh, 85vh)',
          /* Safe area: don't overlap home indicator on iPhone */
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-booth-dim" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-booth-border shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-2xl text-booth-text tracking-wide">GALLERY</h2>
            <span className="font-mono text-xs text-booth-muted bg-booth-border rounded-full px-2 py-0.5">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <button onClick={() => setConfirmClear(true)}
                className="font-mono text-[10px] uppercase tracking-wider text-booth-muted hover:text-booth-accent transition-colors px-2 py-1">
                Clear all
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-booth-border text-booth-muted hover:text-booth-text transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-booth-border shrink-0">
          <TabButton active={tab === 'photos'} onClick={() => setTab('photos')}
            icon={<Camera size={13} />} label="Photos" count={photos.length} />
          <TabButton active={tab === 'strips'} onClick={() => setTab('strips')}
            icon={<Film size={13} />} label="Strips" count={strips.length} />
          <TabButton active={tab === 'gifs'} onClick={() => setTab('gifs')}
            icon={<Clapperboard size={13} />} label="GIFs" count={gifs.length} color="amber" />
        </div>

        {/* Content — flex-1 + overflow-y-auto = scrollable */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin min-h-0">
          {tab === 'photos' && (
            photos.length === 0 ? <EmptyState label="No photos yet" /> : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map(photo => (
                  <PhotoTile key={photo.id} photo={photo}
                    onView={() => setLightbox({ src: photo.dataUrl, title: formatTimestamp(photo.timestamp), ext: 'png' })}
                    onDownload={() => downloadDataUrl(photo.dataUrl, `lumisnap-${photo.id}.png`)}
                    onDelete={() => onDeletePhoto(photo.id)}
                    onQR={() => setQrItem({ src: photo.dataUrl, title: formatTimestamp(photo.timestamp) })}
                  />
                ))}
              </div>
            )
          )}
          {tab === 'strips' && (
            strips.length === 0 ? <EmptyState label="No strips yet" /> : (
              <div className="grid grid-cols-2 gap-3">
                {strips.map(strip => (
                  <StripTile key={strip.id} strip={strip}
                    onView={() => setLightbox({ src: strip.dataUrl, title: `Strip · ${formatTimestamp(strip.timestamp)}`, ext: 'png' })}
                    onDownload={() => downloadDataUrl(strip.dataUrl, `lumisnap-strip-${strip.id}.png`)}
                    onDelete={() => onDeleteStrip(strip.id)}
                  />
                ))}
              </div>
            )
          )}
          {tab === 'gifs' && (
            gifs.length === 0 ? <EmptyState label="No GIFs yet — try GIF mode!" /> : (
              <div className="grid grid-cols-2 gap-3">
                {gifs.map(gif => (
                  <GifTile key={gif.id} gif={gif}
                    onView={() => setLightbox({ src: gif.dataUrl, title: `GIF · ${formatTimestamp(gif.timestamp)}`, ext: 'gif' })}
                    onDownload={() => downloadDataUrl(gif.dataUrl, `lumisnap-${gif.id}.gif`)}
                    onDelete={() => onDeleteGif(gif.id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Confirm clear */}
      {confirmClear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-booth-panel border border-booth-border rounded-xl p-6 max-w-xs w-full">
            <h3 className="font-display text-xl text-booth-text mb-2">CLEAR ALL?</h3>
            <p className="font-mono text-xs text-booth-muted mb-5">Permanently delete all {totalCount} items.</p>
            <div className="flex gap-3">
              <button onClick={() => { onClearAll(); setConfirmClear(false); }}
                className="flex-1 py-2 rounded-lg bg-booth-accent text-white font-mono text-xs uppercase tracking-wider hover:opacity-90 transition-opacity">
                Delete all
              </button>
              <button onClick={() => setConfirmClear(false)}
                className="flex-1 py-2 rounded-lg bg-booth-border text-booth-muted font-mono text-xs uppercase tracking-wider hover:text-booth-text transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox src={lightbox.src} title={lightbox.title} ext={lightbox.ext}
          onClose={() => setLightbox(null)}
          onDownload={() => downloadDataUrl(lightbox.src, `lumisnap-download.${lightbox.ext}`)}
          narrow={lightbox.ext === 'png' && lightbox.title.includes('Strip')}
        />
      )}

      {/* QR modal */}
      {qrItem && (
        <QRDownloadModal dataUrl={qrItem.src} title={qrItem.title} onClose={() => setQrItem(null)} />
      )}
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const TabButton: React.FC<{
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; count: number; color?: string;
}> = ({ active, onClick, icon, label, count, color }) => (
  <button onClick={onClick}
    className={`flex items-center gap-1.5 flex-1 justify-center py-3 font-mono text-[10px] uppercase tracking-wider border-b-2 transition-all
      ${active
        ? color === 'amber' ? 'border-booth-amber text-booth-amber' : 'border-booth-accent text-booth-accent'
        : 'border-transparent text-booth-muted hover:text-booth-text'
      }`}>
    {icon}{label}
    {count > 0 && (
      <span className={`rounded-full px-1.5 py-0.5 text-[9px]
        ${active ? (color === 'amber' ? 'bg-booth-amber text-black' : 'bg-booth-accent text-white') : 'bg-booth-border'}`}>
        {count}
      </span>
    )}
  </button>
);

const PhotoTile: React.FC<{
  photo: Photo;
  onView: () => void; onDownload: () => void; onDelete: () => void; onQR: () => void;
}> = ({ photo, onView, onDownload, onDelete, onQR }) => (
  <div className="relative group rounded-lg overflow-hidden aspect-[3/4] bg-booth-border">
    <img src={photo.dataUrl} alt="Captured photo" className="w-full h-full object-cover cursor-pointer" onClick={onView} />
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 gap-1">
      <div className="flex gap-1">
        <button onClick={onDownload} className="flex-1 py-1 rounded bg-booth-accent/90 text-white font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1">
          <Download size={9} />Save
        </button>
        <button onClick={onQR} className="w-7 py-1 rounded bg-booth-border/90 text-booth-muted flex items-center justify-center hover:text-white transition-colors">
          <QrCode size={10} />
        </button>
      </div>
      <button onClick={onDelete} className="w-full py-1 rounded bg-booth-border/90 text-booth-muted font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-red-900/60 hover:text-red-300 transition-colors">
        <Trash2 size={9} />Delete
      </button>
    </div>
  </div>
);

const StripTile: React.FC<{
  strip: PhotoStrip; onView: () => void; onDownload: () => void; onDelete: () => void;
}> = ({ strip, onView, onDownload, onDelete }) => (
  <div className="relative group rounded-lg overflow-hidden bg-booth-border">
    <img src={strip.dataUrl} alt="Photo strip" className="w-full object-cover cursor-pointer" onClick={onView} />
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
      <button onClick={onDownload} className="w-full py-1.5 rounded bg-booth-accent/90 text-white font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1">
        <Download size={10} />Download
      </button>
      <button onClick={onDelete} className="w-full py-1.5 rounded bg-booth-border/90 text-booth-muted font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-red-900/60 hover:text-red-300 transition-colors">
        <Trash2 size={10} />Delete
      </button>
    </div>
  </div>
);

const GifTile: React.FC<{
  gif: GifRecording; onView: () => void; onDownload: () => void; onDelete: () => void;
}> = ({ gif, onView, onDownload, onDelete }) => (
  <div className="relative group rounded-lg overflow-hidden bg-booth-border aspect-video">
    <img src={gif.dataUrl} alt="Animated GIF" className="w-full h-full object-cover cursor-pointer" onClick={onView} />
    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-booth-amber text-black font-mono text-[8px] font-bold uppercase tracking-wider">GIF</div>
    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 gap-1">
      <button onClick={onDownload} className="w-full py-1.5 rounded bg-booth-amber text-black font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 font-semibold">
        <Download size={10} />Download
      </button>
      <button onClick={onDelete} className="w-full py-1.5 rounded bg-booth-border/90 text-booth-muted font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-red-900/60 hover:text-red-300 transition-colors">
        <Trash2 size={10} />Delete
      </button>
    </div>
  </div>
);

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <ChevronDown size={32} className="text-booth-dim mb-3" />
    <p className="font-mono text-xs text-booth-muted uppercase tracking-widest">{label}</p>
  </div>
);

const Lightbox: React.FC<{
  src: string; title: string; ext: string;
  onClose: () => void; onDownload: () => void; narrow?: boolean;
}> = ({ src, title, onClose, onDownload, narrow }) => (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
    style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    onClick={onClose}
  >
    <div
      className={`relative flex flex-col items-center gap-3 ${narrow ? 'max-w-xs' : 'max-w-lg'} w-full`}
      onClick={e => e.stopPropagation()}
    >
      <img src={src} alt={title} className="w-full rounded-xl shadow-2xl" />
      <div className="flex items-center justify-between w-full">
        <span className="font-mono text-xs text-booth-muted">{title}</span>
        <div className="flex gap-2">
          <button onClick={onDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-booth-accent text-white font-mono text-xs uppercase tracking-wider">
            <Download size={12} />Download
          </button>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-booth-border text-booth-muted font-mono text-xs uppercase tracking-wider hover:text-booth-text transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);
