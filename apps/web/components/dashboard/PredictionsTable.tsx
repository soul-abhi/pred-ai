'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';

interface PredictionRow {
  student: string;
  prediction: number;
  confidence: number;
  grade: string;
  date: string;
}

const SAMPLE_DATA: PredictionRow[] = [
  { student: 'Alex Chen', prediction: 88.4, confidence: 94, grade: 'A', date: 'Jun 22, 2026' },
  { student: 'Maria Santos', prediction: 76.2, confidence: 88, grade: 'B', date: 'Jun 22, 2026' },
  { student: 'James Wilson', prediction: 92.1, confidence: 96, grade: 'A', date: 'Jun 21, 2026' },
  { student: 'Priya Patel', prediction: 65.8, confidence: 82, grade: 'C', date: 'Jun 21, 2026' },
  { student: 'Sarah Kim', prediction: 71.3, confidence: 85, grade: 'B', date: 'Jun 20, 2026' },
  { student: 'Liam O\'Brien', prediction: 45.6, confidence: 72, grade: 'D', date: 'Jun 20, 2026' },
  { student: 'Emma Taylor', prediction: 93.7, confidence: 97, grade: 'A', date: 'Jun 19, 2026' },
  { student: 'Noah Garcia', prediction: 58.2, confidence: 78, grade: 'C', date: 'Jun 19, 2026' },
];

const GRADE_CLASS: Record<string, string> = {
  A: 'grade-A', B: 'grade-B', C: 'grade-C', D: 'grade-D', F: 'grade-F',
};

export default function PredictionsTable() {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_DATA.filter(
    (r) => r.student.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#1A3263', marginBottom: 2 }}>
            Recent Predictions
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
            Latest student predictions
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(26,50,99,0.04)',
            borderRadius: 12, padding: '8px 14px',
            border: '1px solid rgba(26,50,99,0.06)',
          }}>
            <Search size={14} color="rgba(26,50,99,0.25)" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontFamily: 'var(--font-body)', fontSize: 13, color: '#1A3263', width: 140,
              }}
            />
          </div>

          {/* Filter */}
          <button className="btn-ghost" style={{ padding: '8px 12px', color: 'rgba(26,50,99,0.4)' }}>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(26,50,99,0.06)' }}>
              {['Student', 'Prediction', 'Confidence', 'Grade', 'Date'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(26,50,99,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.55 + i * 0.03 }}
                className="table-row"
                style={{
                  borderBottom: '1px solid rgba(26,50,99,0.04)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(26,50,99,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#1A3263',
                    }}>
                      {row.student.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#1A3263' }}>
                      {row.student}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: '#1A3263' }}>
                  {row.prediction.toFixed(1)}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(26,50,99,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${row.confidence}%`, height: '100%', borderRadius: 2,
                        background: row.confidence >= 90 ? '#22C55E' : row.confidence >= 80 ? '#1A3263' : '#547792',
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(26,50,99,0.4)' }}>
                      {row.confidence}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span className={`grade-badge ${GRADE_CLASS[row.grade] ?? ''}`} style={{ width: 'auto', height: 'auto', padding: '4px 12px', fontSize: 11 }}>
                    {row.grade}
                  </span>
                </td>
                <td style={{ padding: '12px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
                  {row.date}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(26,50,99,0.06)' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(26,50,99,0.3)' }}>
          Showing {filtered.length} of {SAMPLE_DATA.length} results
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2].map((page) => (
            <button
              key={page}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: page === 1 ? '1px solid rgba(26,50,99,0.3)' : '1px solid rgba(26,50,99,0.08)',
                background: page === 1 ? 'rgba(26,50,99,0.08)' : 'transparent',
                color: page === 1 ? '#1A3263' : 'rgba(26,50,99,0.3)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
              }}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
