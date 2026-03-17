// src/services/cameraService.ts
// Cross-device compatible camera service
// Handles iOS Safari, Android Chrome, Firefox, and desktop browsers

export interface CameraConstraints {
  deviceId?: string;
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

/**
 * Attempts to get a media stream with progressively relaxed constraints.
 * This is essential for cross-device compatibility:
 * - iOS Safari is strict about `exact` deviceId on some versions
 * - Firefox may not support all constraint combinations
 * - Some Android devices report wrong facingMode
 */
async function getStreamWithFallback(
  constraints: CameraConstraints
): Promise<MediaStream> {
  const baseVideo: MediaTrackConstraints = {
    width: { ideal: constraints.width ?? 1280 },
    height: { ideal: constraints.height ?? 720 },
  };

  // Strategy 1: Exact deviceId (desktop + most Android)
  if (constraints.deviceId) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...baseVideo, deviceId: { exact: constraints.deviceId } },
        audio: false,
      });
    } catch (err) {
      // OverconstrainedError on iOS — fall through to ideal
      if (
        err instanceof Error &&
        (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError')
      ) {
        // Try with `ideal` instead of `exact`
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { ...baseVideo, deviceId: { ideal: constraints.deviceId } },
            audio: false,
          });
        } catch {
          // Fall through to facingMode strategy
        }
      } else {
        throw err;
      }
    }
  }

  // Strategy 2: facingMode (mobile front/back toggle)
  if (constraints.facingMode) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...baseVideo, facingMode: { ideal: constraints.facingMode } },
        audio: false,
      });
    } catch {
      // Fall through to bare video
    }
  }

  // Strategy 3: Bare video — absolute fallback (Firefox strict mode, old devices)
  return await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
}

/**
 * Detects whether the browser/device supports camera switching.
 * On iOS, multiple cameras may exist but be exposed as a single device
 * until permissions are granted — so we check after permission.
 */
async function getVideoDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    // On iOS, devices may have empty labels before permission — filter those
    // but still return them so we can attempt switching
    return videoDevices;
  } catch {
    return [];
  }
}

/**
 * Determines the facingMode of a track.
 * Some devices expose this via getCapabilities(), others via getSettings().
 */
function getFacingMode(track: MediaStreamTrack): 'user' | 'environment' | null {
  try {
    // Prefer getSettings() — more reliable on Android
    const settings = track.getSettings();
    if (settings.facingMode === 'user' || settings.facingMode === 'environment') {
      return settings.facingMode;
    }

    // Fallback: getCapabilities() — available on some iOS versions
    if ('getCapabilities' in track) {
      const caps = (track as MediaStreamTrack & {
        getCapabilities?: () => MediaTrackCapabilities & { facingMode?: string[] };
      }).getCapabilities?.();
      const facing = caps?.facingMode?.[0];
      if (facing === 'user' || facing === 'environment') return facing;
    }
  } catch {
    // Some browsers throw on getSettings() for inactive tracks
  }
  return null;
}

export const cameraService = {
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch {
      return false;
    }
  },

  async getDevices(): Promise<MediaDeviceInfo[]> {
    return getVideoDevices();
  },

  async startStream(constraints: CameraConstraints = {}): Promise<MediaStream> {
    return getStreamWithFallback(constraints);
  },

  stopStream(stream: MediaStream | null | undefined): void {
    if (!stream) return;
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // Track may already be stopped
      }
    });
  },

  attachToVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      // Detach previous stream cleanly
      if (video.srcObject && video.srcObject !== stream) {
        video.srcObject = null;
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true; // Required for iOS

      const onLoaded = () => {
        cleanup();
        video.play().then(resolve).catch(err => {
          // AbortError is common when switching cameras quickly — treat as success
          if (err?.name === 'AbortError') resolve();
          else reject(err);
        });
      };

      const onError = (e: Event) => {
        cleanup();
        reject(e);
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoaded);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });

      // Fallback: if loadedmetadata never fires (some iOS versions)
      setTimeout(() => {
        if (video.readyState >= 1) {
          cleanup();
          video.play().then(resolve).catch(() => resolve());
        }
      }, 3000);
    });
  },

  detachFromVideo(video: HTMLVideoElement): void {
    try {
      video.pause();
      video.srcObject = null;
    } catch {
      // May throw if video element is already detached
    }
  },

  getFacingMode,
};
