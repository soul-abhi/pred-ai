'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const data = [
  { metric: 'MAE', value: 4.2 },
  { metric: 'RMSE', value: 5.8 },
  { metric: 'Accuracy', value: 87.3 },
  { metric: 'Precision', value: 82.1 },
  { metric: 'Recall', value: 79.6 },
];

const COLORS = ['#1A3263', '#2A4A7F', '#547792', '#FAB95B', '#D4892E'];

export default function PerformanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: '24px 24px 12px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#1A3263', marginBottom: 2 }}>
          Performance Metrics
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
          Model evaluation summary
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,50,99,0.06)" />
          <XAxis dataKey="metric" tick={{ fontSize: 12, fill: 'rgba(26,50,99,0.4)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(26,50,99,0.3)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid rgba(26,50,99,0.10)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '10px 14px',
            }}
            labelStyle={{ color: '#1A3263', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}
            cursor={{ fill: 'rgba(26,50,99,0.06)' }}
            formatter={(value) => [Number(value).toFixed(1), '']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
