import { useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

const INTERACTIVE_SELECTORS = 'a, button, .card-interactive';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef<Position>({ x: -100, y: -100 });
  const dotPos = useRef<Position>({ x: -100, y: -100 });
  const followerPos = useRef<Position>({ x: -100, y: -100 });
  const trailPos = useRef<Position>({ x: -100, y: -100 });
  const isHovering = useRef(false);
  const rafId = useRef<number>(0);

  const isMobile = globalThis.window !== undefined && globalThis.window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) return;

    function animate() {
      dotPos.current.x = lerp(dotPos.current.x, mousePos.current.x, 0.2);
      dotPos.current.y = lerp(dotPos.current.y, mousePos.current.y, 0.2);
      followerPos.current.x = lerp(followerPos.current.x, mousePos.current.x, 0.08);
      followerPos.current.y = lerp(followerPos.current.y, mousePos.current.y, 0.08);
      trailPos.current.x = lerp(trailPos.current.x, mousePos.current.x, 0.04);
      trailPos.current.y = lerp(trailPos.current.y, mousePos.current.y, 0.04);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${dotPos.current.x}px, ${dotPos.current.y}px)`;
      }
      if (followerRef.current) {
        followerRef.current.style.transform = `translate(${followerPos.current.x}px, ${followerPos.current.y}px)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${trailPos.current.x}px, ${trailPos.current.y}px)`;
      }
      rafId.current = requestAnimationFrame(animate);
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(INTERACTIVE_SELECTORS)) {
        isHovering.current = true;
        if (dotRef.current) {
          dotRef.current.style.width = '50px';
          dotRef.current.style.height = '50px';
          dotRef.current.style.marginLeft = '-25px';
          dotRef.current.style.marginTop = '-25px';
          dotRef.current.style.background = '#7c5cfc';
        }
        if (followerRef.current) {
          followerRef.current.style.width = '70px';
          followerRef.current.style.height = '70px';
          followerRef.current.style.marginLeft = '-35px';
          followerRef.current.style.marginTop = '-35px';
          followerRef.current.style.borderColor = '#7c5cfc';
        }
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      if ((e.target as Element).closest(INTERACTIVE_SELECTORS)) {
        isHovering.current = false;
        if (dotRef.current) {
          dotRef.current.style.width = '8px';
          dotRef.current.style.height = '8px';
          dotRef.current.style.marginLeft = '-4px';
          dotRef.current.style.marginTop = '-4px';
          dotRef.current.style.background = '#fff';
        }
        if (followerRef.current) {
          followerRef.current.style.width = '40px';
          followerRef.current.style.height = '40px';
          followerRef.current.style.marginLeft = '-20px';
          followerRef.current.style.marginTop = '-20px';
          followerRef.current.style.borderColor = 'rgba(124,92,252,0.5)';
        }
      }
    };

    globalThis.window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    rafId.current = requestAnimationFrame(animate);

    return () => {
      globalThis.window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(rafId.current);
    };
  }, [isMobile]);

  if (isMobile) return null;

  const transition = 'width 0.3s cubic-bezier(0.22,1,0.36,1), height 0.3s cubic-bezier(0.22,1,0.36,1), margin 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s cubic-bezier(0.22,1,0.36,1), border-color 0.3s cubic-bezier(0.22,1,0.36,1)';

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 8, height: 8,
          marginLeft: -4, marginTop: -4, borderRadius: '50%', background: '#fff',
          mixBlendMode: 'difference', zIndex: 10000, pointerEvents: 'none',
          transition, willChange: 'transform',
        }}
      />
      <div
        ref={followerRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 40, height: 40,
          marginLeft: -20, marginTop: -20, borderRadius: '50%',
          border: '1.5px solid rgba(124,92,252,0.5)', background: 'transparent',
          zIndex: 10000, pointerEvents: 'none', transition, willChange: 'transform',
        }}
      />
      <div
        ref={trailRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: 4, height: 4,
          marginLeft: -2, marginTop: -2, borderRadius: '50%',
          background: '#7c5cfc', opacity: 0.6, zIndex: 10000,
          pointerEvents: 'none', willChange: 'transform',
        }}
      />
    </>
  );
}