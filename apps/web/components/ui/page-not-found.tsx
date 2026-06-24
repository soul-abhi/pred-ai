'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── Types ───────────────────────────────────────────────────── */
interface StickFigure {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
}

interface Circulo {
  x: number;
  y: number;
  size: number;
}

/* ── Stick figures ───────────────────────────────────────────── */
const FIGURES: StickFigure[] = [
  {
    top: '0%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    transform: 'rotateZ(-90deg)',
    speedX: 1500,
  },
  {
    top: '10%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick1.svg',
    speedX: 3000,
    speedRotation: 2000,
  },
  {
    top: '20%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick2.svg',
    speedX: 5000,
    speedRotation: 1000,
  },
  {
    top: '25%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    speedX: 2500,
    speedRotation: 1500,
  },
  {
    top: '35%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg',
    speedX: 2000,
    speedRotation: 300,
  },
  {
    bottom: '5%',
    src: 'https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick3.svg',
    speedX: 0,
  },
];

/* ── Message ─────────────────────────────────────────────────── */
function MessageDisplay() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute flex flex-col justify-center items-center w-[90%] h-[90%]"
      style={{ zIndex: 100 }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}
      >
        <div
          style={{
            fontSize: 35,
            fontWeight: 600,
            color: '#FFFFFF',
            margin: '1%',
            fontFamily: 'var(--font-display)',
          }}
        >
          Page Not Found
        </div>

        <div
          style={{
            fontSize: 100,
            fontWeight: 700,
            color: '#FFFFFF',
            margin: '0',
            lineHeight: 1,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </div>

        <div
          style={{
            fontSize: 15,
            width: '50%',
            minWidth: '40%',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            margin: '2% 1% 1%',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.6,
          }}
        >
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 32 }}>
          {/* Go Back */}
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              border: '2px solid rgba(255,255,255,0.7)',
              background: 'transparent',
              color: '#FFFFFF',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              borderRadius: 4,
              transition: 'background 250ms ease, color 250ms ease, transform 200ms ease',
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = '#FFFFFF';
              b.style.color = '#000000';
              b.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = 'transparent';
              b.style.color = '#FFFFFF';
              b.style.transform = 'scale(1)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            Go Back
          </button>

          {/* Go Home */}
          <button
            onClick={() => router.push('/overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              background: '#FFFFFF',
              color: '#000000',
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              border: '2px solid #FFFFFF',
              borderRadius: 4,
              transition: 'background 250ms ease, transform 200ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.85)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Stick figures layer ─────────────────────────────────────── */
export function CharactersAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    container.innerHTML = '';

    FIGURES.forEach((figure, i) => {
      const img = document.createElement('img');
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.style.position = 'absolute';
      img.style.width = '18%';
      img.style.height = '18%';
      if (figure.top) img.style.top = figure.top;
      if (figure.bottom) img.style.bottom = figure.bottom;
      img.src = figure.src;
      if (figure.transform) img.style.transform = figure.transform;
      container.appendChild(img);

      if (i === FIGURES.length - 1) return; // last is static

      img.animate(
        [{ left: '100%' }, { left: '-20%' }],
        { duration: figure.speedX, easing: 'linear', fill: 'forwards' },
      );

      if (i === 0) return; // first: no rotation

      if (figure.speedRotation) {
        img.animate(
          [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }],
          { duration: figure.speedRotation, iterations: Infinity, easing: 'linear' },
        );
      }
    });

    return () => { if (container) container.innerHTML = ''; };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', width: '99%', height: '95%', pointerEvents: 'none' }}
    />
  );
}

/* ── Expanding white circles ─────────────────────────────────── */
export function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef(0);
  const circlesRef = useRef<Circulo[]>([]);

  const init = (canvas: HTMLCanvasElement) => {
    circlesRef.current = [];
    for (let i = 0; i < 300; i++) {
      const x =
        Math.floor(Math.random() * (canvas.width * 3 - canvas.width * 1.2 + 1)) +
        canvas.width * 1.2;
      const y =
        Math.floor(Math.random() * (canvas.height - canvas.height * -0.2 + 1)) +
        canvas.height * -0.2;
      circlesRef.current.push({ x, y, size: canvas.width / 1000 });
    }
  };

  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    timerRef.current++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dx = canvas.width / 80;
    const gr = canvas.width / 1000;

    ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    circlesRef.current.forEach((c) => {
      ctx.beginPath();
      if (timerRef.current < 65) {
        c.x -= dx;
        c.size += gr;
      } else if (timerRef.current < 500) {
        c.x -= dx * 0.02;
        c.size += gr * 0.2;
      }
      ctx.arc(c.x, c.y, Math.max(0, c.size), 0, Math.PI * 2);
      ctx.fill();
    });

    if (timerRef.current >= 500) return;
    rafRef.current = requestAnimationFrame(() => draw(canvas, ctx));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      timerRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      init(canvas);
      draw(canvas, ctx);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

/* ── 404 page ────────────────────────────────────────────────── */
export default function NotFoundPage() {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <MessageDisplay />
      <CharactersAnimation />
      <CircleAnimation />
    </div>
  );
}
