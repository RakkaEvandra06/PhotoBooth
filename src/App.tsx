// src/App.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';

import { CameraPreview }       from './components/CameraPreview';
import { CountdownOverlay }    from './components/CountdownOverlay';
import { FlashOverlay }        from './components/FlashOverlay';
import { FilterSelector }      from './components/FilterSelector';
import { CaptureButton }       from './components/CaptureButton';
import { ControlBar }          from './components/ControlBar';
import { StripProgress }       from './components/StripProgress';
import { GalleryDrawer }       from './components/GalleryDrawer';
import { StripResultModal }    from './components/StripResultModal';
import { StripTemplateBar }    from './components/StripTemplateBar';
import { GifResultModal }      from './components/GifResultModal';
import { GifRecordingOverlay } from './components/GifRecordingOverlay';
import { StickerLayer }        from './components/StickerLayer';
import { StickerPicker }       from './components/StickerPicker';
import { Header }              from './components/Header';

import { useCamera }      from './hooks/useCamera';
import { useCountdown }   from './hooks/useCountdown';
import { useGallery }     from './hooks/useGallery';
import { useGifRecorder } from './hooks/useGifRecorder';
import { useStickers }    from './hooks/useStickers';

import { captureFrame, buildPhotoStrip } from './utils/photoUtils';
import type { FilterType, CaptureMode, Photo, PhotoStrip, GifRecording } from './types';

const STRIP_COUNT       = 4;
const STRIP_INTERVAL_MS = 1200;

/**
 * useViewportHeight
 * Sets --vh CSS var to 1% of the real window.innerHeight.
 * Fixes the classic "100vh includes browser chrome" bug on mobile.
 */
function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', setVH);
    };
  }, []);
}

/** useLandscape — true when phone is rotated (height < 500px) */
function useLandscape() {
  const [ls, setLs] = useState(
    () => typeof window !== 'undefined' && window.innerHeight < 500 && window.innerWidth > window.innerHeight
  );
  useEffect(() => {
    const check = () => setLs(window.innerHeight < 500 && window.innerWidth > window.innerHeight);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);
  return ls;
}

export default function App() {
  useViewportHeight();
  const isLandscape = useLandscape();

  const camera       = useCamera();
  const { countdown, start: startCountdown } = useCountdown();
  const gallery      = useGallery();
  const gifRecorder  = useGifRecorder();
  const stickerState = useStickers();

  const [selectedFilter,    setSelectedFilter]    = useState<FilterType>('none');
  const [selectedTemplate,  setSelectedTemplate]  = useState<string>('classic');
  const [isMirror,          setIsMirror]          = useState(false);
  const [captureMode,       setCaptureMode]       = useState<CaptureMode>('single');
  const [countdownEnabled,  setCountdownEnabled]  = useState(true);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [isCapturing,       setIsCapturing]       = useState(false);
  const [showFlash,         setShowFlash]         = useState(false);
  const [showGallery,       setShowGallery]       = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const [stripPhotos,    setStripPhotos]    = useState<Photo[]>([]);
  const [completedStrip, setCompletedStrip] = useState<PhotoStrip | null>(null);
  const [completedGif,   setCompletedGif]   = useState<GifRecording | null>(null);
  const [lastPhoto,      setLastPhoto]      = useState<Photo | null>(null);

  const viewportRef  = useRef<HTMLDivElement>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerFlash = useCallback(() => {
    setShowFlash(true);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setShowFlash(false), 500);
  }, []);

  const captureSinglePhoto = useCallback((): Photo | null => {
    if (!camera.videoRef.current || !camera.isReady) return null;
    const photo = captureFrame(camera.videoRef.current, selectedFilter, isMirror);
    triggerFlash();
    gallery.addPhoto(photo);
    setLastPhoto(photo);
    return photo;
  }, [camera.videoRef, camera.isReady, selectedFilter, isMirror, triggerFlash, gallery]);

  const handleSingleCapture = useCallback(async () => {
    if (isCapturing || !camera.isReady) return;
    setIsCapturing(true);
    try {
      if (countdownEnabled) await startCountdown(countdownDuration);
      captureSinglePhoto();
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, camera.isReady, countdownEnabled, countdownDuration, startCountdown, captureSinglePhoto]);

  const handleStripCapture = useCallback(async () => {
    if (isCapturing || !camera.isReady) return;
    setIsCapturing(true);
    setStripPhotos([]);
    const collected: Photo[] = [];
    try {
      for (let i = 0; i < STRIP_COUNT; i++) {
        if (countdownEnabled) {
          await startCountdown(i === 0 ? countdownDuration : 2);
        } else if (i > 0) {
          await new Promise<void>(res => setTimeout(res, STRIP_INTERVAL_MS));
        }
        const photo = captureSinglePhoto();
        if (!photo) break;
        collected.push(photo);
        setStripPhotos([...collected]);
      }
      if (collected.length === STRIP_COUNT) {
        const strip = await buildPhotoStrip(collected, selectedTemplate);
        gallery.addStrip(strip);
        setCompletedStrip(strip);
      }
    } finally {
      setIsCapturing(false);
      setStripPhotos([]);
    }
  }, [isCapturing, camera.isReady, countdownEnabled, countdownDuration, startCountdown, captureSinglePhoto, gallery, selectedTemplate]);

  const handleGifCapture = useCallback(async () => {
    if (isCapturing || !camera.isReady || !camera.videoRef.current) return;
    setIsCapturing(true);
    try {
      const gif = await gifRecorder.record(camera.videoRef.current);
      gallery.addGif(gif);
      setCompletedGif(gif);
    } catch (err) {
      console.error('GIF recording failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, camera.isReady, camera.videoRef, gifRecorder, gallery]);

  const handleCapture = useCallback(() => {
    if (captureMode === 'single')     handleSingleCapture();
    else if (captureMode === 'strip') handleStripCapture();
    else if (captureMode === 'gif')   handleGifCapture();
  }, [captureMode, handleSingleCapture, handleStripCapture, handleGifCapture]);

  const handleSetMode = useCallback((mode: CaptureMode) => {
    setCaptureMode(mode);
    setShowStickerPicker(false);
  }, []);

  const totalPhotoCount = gallery.photos.length + gallery.strips.length + gallery.gifs.length;

  // ── Shared camera viewport ─────────────────────────────────────────────────
  const CameraViewport = (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden bg-black ${
        isLandscape ? 'flex-1' : 'mx-2 mt-1'
      }`}
      style={
        isLandscape
          ? { minWidth: 0 }
          : {
              flex: '1 1 0',
              minHeight: 0,
              borderRadius: '24px',
            }
      }
    >
      <CameraPreview
        videoRef={camera.videoRef as React.RefObject<HTMLVideoElement>}
        filter={selectedFilter}
        isMirror={isMirror}
        isReady={camera.isReady}
        isLoading={camera.isLoading}
        error={camera.error}
      />
      {camera.isReady && (
        <>
          <div className={`absolute top-3 left-3 border-t-2 border-l-2 border-booth-accent/60 pointer-events-none z-10 ${isLandscape ? 'w-4 h-4' : 'w-6 h-6'}`} />
          <div className={`absolute top-3 right-3 border-t-2 border-r-2 border-booth-accent/60 pointer-events-none z-10 ${isLandscape ? 'w-4 h-4' : 'w-6 h-6'}`} />
          <div className={`absolute bottom-3 left-3 border-b-2 border-l-2 border-booth-accent/60 pointer-events-none z-10 ${isLandscape ? 'w-4 h-4' : 'w-6 h-6'}`} />
          <div className={`absolute bottom-3 right-3 border-b-2 border-r-2 border-booth-accent/60 pointer-events-none z-10 ${isLandscape ? 'w-4 h-4' : 'w-6 h-6'}`} />
        </>
      )}
      {captureMode === 'gif' && camera.isReady && !gifRecorder.state.isRecording && !gifRecorder.state.isEncoding && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-booth-amber/20 border border-booth-amber/50 backdrop-blur-sm rounded-full px-3 py-1 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-booth-amber" />
          <span className="font-mono text-[10px] text-booth-amber uppercase tracking-wider">
            {isLandscape ? 'GIF·3s' : 'GIF mode · 3s'}
          </span>
        </div>
      )}
      <StickerLayer stickers={stickerState.stickers} onMove={stickerState.moveSticker} onDelete={stickerState.deleteSticker} onScale={stickerState.scaleSticker} containerRef={viewportRef} />
      {lastPhoto && !showGallery && !isCapturing && (
        <button
          onClick={() => setShowGallery(true)}
          className={`absolute bottom-3 left-3 z-20 rounded-lg overflow-hidden border-2 border-white/30 hover:border-booth-accent transition-all shadow-lg ${isLandscape ? 'w-10 h-10' : 'w-14 h-14'}`}
        >
          <img src={lastPhoto.dataUrl} alt="Last photo" className="w-full h-full object-cover" />
        </button>
      )}
      <CountdownOverlay countdown={countdown} />
      <StripProgress photos={stripPhotos} total={STRIP_COUNT} />
      <GifRecordingOverlay state={gifRecorder.state} onCancel={gifRecorder.cancel} />
      <FlashOverlay show={showFlash} />
    </div>
  );

  // ── Shared modals ──────────────────────────────────────────────────────────
  const Modals = (
    <>
      {showGallery && (
        <GalleryDrawer photos={gallery.photos} strips={gallery.strips} gifs={gallery.gifs} onDeletePhoto={gallery.deletePhoto} onDeleteStrip={gallery.deleteStrip} onDeleteGif={gallery.deleteGif} onClearAll={gallery.clearAll} onClose={() => setShowGallery(false)} />
      )}
      {completedStrip && (
        <StripResultModal
          strip={completedStrip}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          onClose={() => setCompletedStrip(null)}
          onRetake={() => { setCompletedStrip(null); handleStripCapture(); }}
        />
      )}
      {completedGif && (
        <GifResultModal gif={completedGif} onClose={() => setCompletedGif(null)} onRetake={() => { setCompletedGif(null); handleGifCapture(); }} />
      )}
    </>
  );

  // ── Landscape layout (phone rotated) ──────────────────────────────────────
  if (isLandscape) {
    return (
      <div
        className="flex flex-row bg-booth-bg overflow-hidden"
        style={{ height: 'calc(var(--vh, 1vh) * 100)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        {CameraViewport}
        <div
          className="flex flex-col gap-2 py-2 px-2 overflow-y-auto shrink-0"
          style={{ width: '190px' }}
        >
          <Header compact />
          <FilterSelector selected={selectedFilter} onChange={setSelectedFilter} videoRef={camera.videoRef as React.RefObject<HTMLVideoElement>} compact />
          <div className="flex justify-center">
            <CaptureButton onClick={handleCapture} isCapturing={isCapturing} captureMode={captureMode} stripProgress={stripPhotos.length} gifProgress={gifRecorder.state.progress} disabled={!camera.isReady} compact />
          </div>
          <ControlBar captureMode={captureMode} onSetMode={handleSetMode} isMirror={isMirror} onToggleMirror={() => setIsMirror(m => !m)} countdownEnabled={countdownEnabled} onToggleCountdown={() => setCountdownEnabled(e => !e)} countdownDuration={countdownDuration} onSetCountdownDuration={setCountdownDuration} canSwitchCamera={camera.canSwitchCamera} onSwitchCamera={camera.cycleCamera} onOpenGallery={() => setShowGallery(true)} photoCount={totalPhotoCount} onToggleStickers={() => setShowStickerPicker(s => !s)} showStickers={stickerState.stickers.length > 0 || showStickerPicker} compact />
          {captureMode === 'strip' && (
            <StripTemplateBar selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} compact previewPhotos={gallery.photos.slice(0,4)} />
          )}
          {showStickerPicker && (
            <StickerPicker onAdd={stickerState.addSticker} onClearAll={stickerState.clearStickers} stickerCount={stickerState.stickers.length} onClose={() => setShowStickerPicker(false)} />
          )}
        </div>
        {Modals}
      </div>
    );
  }

  // ── Portrait layout (default) ──────────────────────────────────────────────
  return (
    <div
      className="bg-black flex items-center justify-center overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Center column — max 520px on desktop, full width on mobile */}
      <div
        className="bg-booth-bg flex flex-col w-full overflow-hidden"
        style={{
          maxWidth: '520px',
          height: '100%',
        }}
      >
      <Header />
      {CameraViewport}
      {/* Controls: fixed height, pb-safe respects iPhone home indicator */}
      <div className="relative flex flex-col gap-2 px-3 pt-2 pb-safe shrink-0">
        <FilterSelector selected={selectedFilter} onChange={setSelectedFilter} videoRef={camera.videoRef as React.RefObject<HTMLVideoElement>} />
        <div className="flex justify-center">
          <CaptureButton onClick={handleCapture} isCapturing={isCapturing} captureMode={captureMode} stripProgress={stripPhotos.length} gifProgress={gifRecorder.state.progress} disabled={!camera.isReady} />
        </div>
        <ControlBar captureMode={captureMode} onSetMode={handleSetMode} isMirror={isMirror} onToggleMirror={() => setIsMirror(m => !m)} countdownEnabled={countdownEnabled} onToggleCountdown={() => setCountdownEnabled(e => !e)} countdownDuration={countdownDuration} onSetCountdownDuration={setCountdownDuration} canSwitchCamera={camera.canSwitchCamera} onSwitchCamera={camera.cycleCamera} onOpenGallery={() => setShowGallery(true)} photoCount={totalPhotoCount} onToggleStickers={() => setShowStickerPicker(s => !s)} showStickers={stickerState.stickers.length > 0 || showStickerPicker} />
        {captureMode === 'strip' && (
          <StripTemplateBar selectedTemplate={selectedTemplate} onSelect={setSelectedTemplate} previewPhotos={gallery.photos.slice(0,4)} />
        )}
        {showStickerPicker && (
          <StickerPicker onAdd={stickerState.addSticker} onClearAll={stickerState.clearStickers} stickerCount={stickerState.stickers.length} onClose={() => setShowStickerPicker(false)} />
        )}
      </div>
      </div>
      {Modals}
    </div>
  );
}