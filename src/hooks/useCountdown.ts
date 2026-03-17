// src/hooks/useCountdown.ts

import { useState, useRef, useCallback } from 'react';
import type { CountdownState } from '../types';

export function useCountdown() {
  const [countdown, setCountdown] = useState<CountdownState>({
    isActive: false,
    count: 0,
    duration: 3,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((duration: number): Promise<void> => {
    return new Promise(resolve => {
      setCountdown({ isActive: true, count: duration, duration });

      let current = duration;
      timerRef.current = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(timerRef.current!);
          setCountdown({ isActive: false, count: 0, duration });
          resolve();
        } else {
          setCountdown(s => ({ ...s, count: current }));
        }
      }, 1000);
    });
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(s => ({ ...s, isActive: false, count: 0 }));
  }, []);

  return { countdown, start, cancel };
}
