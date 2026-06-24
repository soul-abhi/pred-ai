'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  format?: 'number' | 'decimal' | 'percent';
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  sub?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export default function MetricCard({ label, value, unit, trend, sub, icon, delay = 0 }: MetricCardProps) {
  const trendIcon = trend?.direction === 'up' ? <TrendingUp size={14} /> : trend?.direction === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />;
  const trendColor = trend?.direction === 'up' ? '#22C55E' : trend?.direction === 'down' ? '#EF4444' : 'rgba(26,50,99,0.30)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: '24px 26px', minWidth: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'rgba(26,50,99,0.5)' }}>
          {label}
        </span>
        {icon && (
          <div style={{ color: 'rgba(26,50,99,0.5)', display: 'flex' }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 36,
            color: '#1A3263',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'rgba(26,50,99,0.35)' }}>
            {unit}
          </span>
        )}
      </div>

      {(trend || sub) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          {trend && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: trendColor, fontSize: 13, fontWeight: 500 }}>
              {trendIcon}
              <span>{trend.value}</span>
            </div>
          )}
          {sub && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(26,50,99,0.35)' }}>
              {sub}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
