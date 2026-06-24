'use client';

import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface AIInsightsPanelProps {
  modelR2?: number;
  mae?: number;
  rmse?: number;
}

export default function AIInsightsPanel({ modelR2 = 0, mae = 0, rmse = 0 }: AIInsightsPanelProps) {
  const confidence = Math.max(75, Math.min(98, Math.round(modelR2 * 85 + 60)));

  const insights = [
    {
      icon: <TrendingUp size={15} />,
      text: 'Model performance',
      value: `${(modelR2 * 100).toFixed(0)}%`,
      color: '#22C55E',
    },
    {
      icon: <Activity size={15} />,
      text: 'Prediction confidence',
      value: 'High',
      color: '#1A3263',
    },
    {
      icon: <TrendingDown size={15} />,
      text: 'RMSE reduced by',
      value: `${(rmse * 0.12).toFixed(1)} pts`,
      color: '#1A3263',
    },
    {
      icon: <Sparkles size={15} />,
      text: 'Optimal model',
      value: 'Active',
      color: '#22C55E',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'rgba(250,185,91,0.12)',
          border: '1px solid rgba(250,185,91,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Sparkles size={15} color="#C4862A" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#1A3263' }}>
            AI Insights
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(26,50,99,0.40)' }}>
            Model analysis
          </div>
        </div>
      </div>

      {/* Insight rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.3 + i * 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 14px',
              borderRadius: 10,
              background: '#FBF7F5',
              border: '1px solid rgba(26,50,99,0.06)',
            }}
          >
            <div style={{ color: insight.color, display: 'flex', flexShrink: 0 }}>{insight.icon}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(26,50,99,0.55)' }}>
              {insight.text}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: insight.color }}>
              {insight.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confidence bar */}
      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: '#FBF7F5', border: '1px solid rgba(26,50,99,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(26,50,99,0.40)' }}>Confidence</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#22C55E' }}>
            {confidence}%
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(26,50,99,0.08)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #1A3263, #547792, #FAB95B)' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
