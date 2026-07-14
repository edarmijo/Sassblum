import { useState, useEffect, useRef } from 'react';
import { secureRandomInt } from '../utils/random';

interface PageLoaderProps {
  onComplete: () => void;
}

export function PageLoader({ onComplete }: Readonly<PageLoaderProps>) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    const finishLoader = async () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      await new Promise(r => setTimeout(r, 200));
      setFadeOut(true);
      await new Promise(r => setTimeout(r, 500));
      onCompleteRef.current();
    };

    const tick = () => {
      setProgress((prev) => {
        if (prev >= 100) {
          finishLoader();
          return 100;
        }
        // Random increment between 2 and 8
        const inc = secureRandomInt(2, 8);
        return Math.min(prev + inc, 100);
      });
    };

    // ~2s total: 100 ticks at ~20ms each ≈ 2s (with random increments it finishes around that)
    intervalRef.current = setInterval(tick, 20);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stroke-dashoffset: 283 is full circumference. offset 283 = 0%, offset 0 = 100%
  const dashOffset = 283 - (283 * progress) / 100;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#06060a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? 'hidden' : 'visible',
        transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), visibility 0.5s',
      }}
    >
      {/* SVG Ring */}
      <svg
        viewBox="0 0 100 100"
        width={120}
        height={120}
        style={{ marginBottom: 24 }}
      >
        {/* Background track */}
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="rgba(124,92,252,0.1)"
          strokeWidth={3}
        />
        {/* Progress ring */}
        <circle
          cx={50}
          cy={50}
          r={45}
          fill="none"
          stroke="#7c5cfc"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={283}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.15s ease' }}
        />
      </svg>

      {/* Logo */}
      <div
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '2rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.1em',
          marginBottom: 12,
        }}
      >
        SASS <span style={{ color: '#7c5cfc' }}>BLUM</span>
      </div>

      {/* Percentage */}
      <div
        style={{
          fontFamily: "'Space Grotesk', monospace",
          fontSize: '0.875rem',
          color: 'rgba(124,92,252,0.8)',
          letterSpacing: '0.05em',
        }}
      >
        {progress}%
      </div>
    </div>
  );
}
