'use client';

import { motion } from 'framer-motion';
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Line, Legend,
} from 'recharts';

export default function RegressionChart() {
  // Generate realistic synthetic regression data
  const points = Array.from({ length: 48 }, () => {
    const actual = 40 + Math.random() * 60;
    const noise = (Math.random() - 0.5) * 12;
    return {
      actual: parseFloat(actual.toFixed(1)),
      predicted: parseFloat((actual + noise).toFixed(1)),
    };
  });

  // Build a combined dataset with scatter points + trend line endpoints
  const lineEndpoints = [
    { actual: 30, predicted: 30.8, line: true },
    { actual: 100, predicted: 95.2, line: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: '24px 24px 12px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#1A3263', marginBottom: 2 }}>
          Regression Accuracy
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
          Actual vs Predicted
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={points} margin={{ left: -16, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,50,99,0.06)" />
          <XAxis dataKey="actual" tick={{ fontSize: 11, fill: 'rgba(26,50,99,0.3)' }} axisLine={false} tickLine={false} />
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
            formatter={(value) => [Number(value).toFixed(1), 'Predicted']}
          />
          <Scatter
            dataKey="predicted"
            fill="#1A3263"
            fillOpacity={0.5}
            r={4}
            shape="circle"
            legendType="circle"
            name="Predictions"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
