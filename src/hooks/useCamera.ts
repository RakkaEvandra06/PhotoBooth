// src/hooks/useCamera.ts
// Fully cross-device compatible camera hook.
// Handles: iOS Safari, Android Chrome/Firefox, desktop browsers.
//
// Key improvements over original:
// 1. Tracks facingMode explicitly — enables toggle on mobile without deviceId
// 2. Single source-of-truth for active stream via ref — prevents double-stop races
// 3. Progressive constraint fallback via cameraService
// 4. Proper cleanup on unmount without stale closure issues
// 5. Re-enumerates devices after permission grant (iOS lazy enumeration fix)

import { useState, useEffect, useRef, useCallback } from 'react';
import { cameraService } from '../services/cameraService';
import type { CameraState } from '../types';

export function useCamera() {
  const videoRef   = useRef<HTMLVideoElement>(null);
  // Keep the active stream in a ref so cleanup always sees the latest value
  const streamRef  = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const [state, setState] = useState<CameraState>({
    isReady:        false,
    isLoading:      false,
    error:          null,
    devices:        [],
    activeDeviceId: null,
    stream:         null,
    facingMode:     'user',
  });

  // ── Internal: stop the current stream ──────────────────────────────────────
  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      cameraService.stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      cameraService.detachFromVideo(videoRef.current);
    }
  }, []);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(
    async (opts: { deviceId?: string; facingMode?: 'user' | 'environment' } = {}) => {
      if (!mountedRef.current) return;

      setState(s => ({ ...s, isLoading: true, error: null, isReady: false }));
      stopCurrentStream();

      try {
        const stream = await cameraService.startStream({
          deviceId:   opts.deviceId,
          facingMode: opts.facingMode ?? 'user',
        });

        if (!mountedRef.current) {
          cameraService.stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          await cameraService.attachToVideo(videoRef.current, stream);
        }

        if (!mountedRef.current) {
          stopCurrentStream();
          return;
        }

        // Re-enumerate devices after stream starts — iOS populates labels only after permission
        const devices = await cameraService.getDevices();

        // Determine active device ID and facing mode from the live track
        const track          = stream.getVideoTracks()[0];
        const settings       = track?.getSettings() ?? {};
        const detectedFacing = cameraService.getFacingMode(track) ?? opts.facingMode ?? 'user';
        const activeDeviceId = settings.deviceId ?? opts.deviceId ?? null;

        setState({
          isReady:        true,
          isLoading:      false,
          error:          null,
          stream,
          devices,
          activeDeviceId,
          facingMode:     detectedFacing,
        });
      } catch (err) {
        if (!mountedRef.current) return;
        const msg =
          err instanceof Error
            ? friendlyError(err)
            : 'Camera access denied';
        setState(s => ({ ...s, isLoading: false, isReady: false, error: msg }));
      }
    },
    [stopCurrentStream]
  );

  // ── Switch to a specific device ────────────────────────────────────────────
  const switchCamera = useCallback(
    async (deviceId: string) => {
      await startCamera({ deviceId });
    },
    [startCamera]
  );

  // ── Cycle through available cameras ───────────────────────────────────────
  // Works in two modes:
  //   a) Multi-device mode: cycles through enumerated deviceIds (desktop/Android)
  //   b) facingMode toggle: flips user ↔ environment (iOS / devices with 1 deviceId)
  const cycleCamera = useCallback(async () => {
    const { devices, activeDeviceId, facingMode } = state;

    // --- Mode A: we have multiple distinct devices ---
    if (devices.length >= 2) {
      const idx  = devices.findIndex(d => d.deviceId === activeDeviceId);
      const next = devices[(idx + 1) % devices.length];
      await startCamera({ deviceId: next.deviceId });
      return;
    }

    // --- Mode B: toggle facingMode (common on iOS) ---
    const nextFacing: 'user' | 'environment' =
      facingMode === 'user' ? 'environment' : 'user';
    await startCamera({ facingMode: nextFacing });
  }, [state, startCamera]);

  // ── Determine if the device supports camera switching ─────────────────────
  // Returns true if there are multiple devices OR if the browser supports facingMode
  // (mobile browsers always support facingMode even with 1 enumerated device)
  const canSwitchCamera =
    state.devices.length > 1 || isMobileWithMultipleCameras();

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    stopCurrentStream();
    setState(s => ({ ...s, isReady: false, stream: null }));
  }, [stopCurrentStream]);

  // ── Auto-start on mount ────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;
      stopCurrentStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    ...state,
    // Expose canSwitchCamera (overrides state.devices.length > 1 check)
    canSwitchCamera,
    startCamera,
    stopCamera,
    switchCamera,
    cycleCamera,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Heuristic: mobile browsers almost always have front + back cameras,
 * even if they only enumerate as a single device before permission is granted.
 */
function isMobileWithMultipleCameras(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Converts raw browser errors to user-friendly messages.
 */
function friendlyError(err: Error): string {
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access denied. Please allow camera access in your browser settings.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera found on this device.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera is in use by another app. Please close it and try again.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Camera does not support the requested settings. Trying defaults…';
    case 'NotSupportedError':
      return 'Your browser does not support camera access. Please use Chrome or Safari.';
    case 'AbortError':
      return 'Camera access was interrupted. Please try again.';
    default:
      return err.message || 'Camera access failed.';
  }
}
