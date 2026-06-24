'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GradeDonutProps {
  grades: { grade: string; count: number }[];
}

const GRADE_COLORS: Record<string, string> = {
  A: '#1A3263',
  B: '#547792',
  C: '#FAB95B',
  D: '#D4892E',
  F: '#EF4444',
};

export default function GradeDonut({ grades }: GradeDonutProps) {
  const total = grades.reduce((s, g) => s + g.count, 0);
  const data = grades.map((g) => ({
    name: g.grade,
    value: g.count,
    color: GRADE_COLORS[g.grade] ?? '#1A3263',
    percentage: total > 0 ? ((g.count / total) * 100).toFixed(0) : '0',
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: 24 }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#1A3263', marginBottom: 2 }}>
          Grade Distribution
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
          {total} total predictions
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Donut chart */}
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(26,50,99,0.10)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  padding: '8px 12px',
                }}
                formatter={(value, name) => [value, `Grade ${name}`]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Grade stats beside donut */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((g, i) => (
            <motion.div
              key={g.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 12,
                background: 'rgba(26,50,99,0.03)',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 8,
                background: `${g.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: g.color,
              }}>
                {g.name}
              </div>
              <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.5)' }}>
                {g.percentage}%
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#1A3263' }}>
                {g.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
