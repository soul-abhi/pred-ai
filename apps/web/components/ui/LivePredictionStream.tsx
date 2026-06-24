'use client';
// Animated right-panel on auth pages: a looping stream of fake-but-plausible prediction cards
import { useEffect, useState } from 'react';

const SAMPLES = [
  { attendance: 92, study: 6.5, prev: 84, sleep: 7, score: 88.2, grade: 'B' },
  { attendance: 74, study: 3.0, prev: 61, sleep: 5, score: 57.4, grade: 'D' },
  { attendance: 98, study: 8.0, prev: 91, sleep: 8, score: 96.1, grade: 'A' },
  { attendance: 81, study: 4.5, prev: 73, sleep: 6, score: 72.8, grade: 'C' },
  { attendance: 65, study: 2.0, prev: 55, sleep: 4, score: 44.3, grade: 'F' },
  { attendance: 88, study: 7.0, prev: 80, sleep: 7.5, score: 83.5, grade: 'B' },
  { attendance: 95, study: 5.5, prev: 88, sleep: 8, score: 91.0, grade: 'A' },
  { attendance: 70, study: 3.5, prev: 66, sleep: 6, score: 62.7, grade: 'C' },
];

const GRADE_COLORS: Record<string, string> = {
  A: '#3DDC84', B: '#3B82F6', C: '#F5A623', D: '#F97316', F: '#FE413C',
};

export default function LivePredictionStream() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, []);

  // Build a doubled list for infinite-scroll illusion
  const doubled = [...SAMPLES, ...SAMPLES];
  const offset = tick % SAMPLES.length;

  return (
    <div className="relative h-full w-full overflow-hidden select-none" aria-hidden="true">
      {/* Ambient gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(254,65,60,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Terminal header bar */}
      <div
        className="absolute top-0 left-0 right-0 px-6 pt-6 pb-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid #1C2B3E' }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#FE413C', opacity: 0.7 }} />
        <span
          className="ml-3 text-xs tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: '#6B6F75' }}
        >
          pred-ai / live inference
        </span>
      </div>

      {/* Stream of cards */}
      <div className="absolute inset-0 pt-16 pb-4 px-6 flex flex-col gap-3 overflow-hidden">
        {doubled.slice(offset, offset + 6).map((item, i) => (
          <PredCard key={`${offset}-${i}`} item={item} delay={i * 80} />
        ))}
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #3D434B 0%, transparent 100%)' }}
      />
    </div>
  );
}

function PredCard({ item, delay }: { item: (typeof SAMPLES)[0]; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className="animate-slide-up"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity 300ms ease ${delay}ms`,
        background: '#2B2F33',
        border: '1px solid #1C2B3E',
        borderRadius: 10,
        padding: '12px 14px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '4px 12px',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B6F75', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        attendance {item.attendance}% · study {item.study}h · sleep {item.sleep}h
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 13,
          color: GRADE_COLORS[item.grade],
          gridRow: '1 / 3',
          alignSelf: 'center',
          padding: '4px 8px',
          borderRadius: 6,
          backgroundColor: `${GRADE_COLORS[item.grade]}1A`,
        }}
      >
        {item.grade}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: '#FFFFFF' }}>
        {item.score}
        <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA0A6', marginLeft: 4 }}>/ 100</span>
      </div>
    </div>
  );
}
