'use client';

import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area,
} from 'recharts';

interface HeroChartProps {
  data: { day: string; count: number; avg: string }[];
}

export default function HeroChart({ data }: HeroChartProps) {
  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: '60px 28px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(26,50,99,0.4)' }}>
          No prediction activity yet.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: '24px 24px 12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#1A3263', marginBottom: 2 }}>
            Prediction Activity
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.4)' }}>
            Last 30 days
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: '#1A3263', lineHeight: 1 }}>
            {data.reduce((s, d) => s + d.count, 0)}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(26,50,99,0.35)' }}>
            total predictions
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A3263" stopOpacity={0.25} />
              <stop offset="50%" stopColor="#547792" stopOpacity={0.10} />
              <stop offset="100%" stopColor="#FAB95B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,50,99,0.06)" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(26,50,99,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgba(26,50,99,0.3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid rgba(26,50,99,0.10)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '10px 14px',
            }}
            labelStyle={{ color: '#1A3263', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}
            itemStyle={{ color: '#1A3263', fontFamily: 'var(--font-mono)', fontSize: 12 }}
            cursor={{ stroke: 'rgba(26,50,99,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area type="monotone" dataKey="count" stroke="none" fill="url(#heroGradient)" />
          <Line
            type="monotone"
            dataKey="count"
            stroke="url(#heroGradient)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#1A3263', stroke: '#FFFFFF', strokeWidth: 2 }}
            name="Predictions"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
