'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Activity, Brain, TrendingUp, Target } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import StatusChip from '@/components/dashboard/StatusChip';
import HeroChart from '@/components/dashboard/HeroChart';
import RegressionChart from '@/components/dashboard/RegressionChart';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import AIInsightsPanel from '@/components/dashboard/AIInsightsPanel';
import GradeDonut from '@/components/dashboard/GradeDonut';
import PredictionsTable from '@/components/dashboard/PredictionsTable';

interface HealthStatus {
  status: string; db: boolean; ml_service: boolean;
  model_loaded: boolean; model_version: string | null;
}
interface ModelRun {
  id: string; mae: number; rmse: number; r2: number;
  cv_r2_mean: number; is_active: boolean; trained_at: string;
}
interface Summary {
  total_predictions: number;
  by_grade: { grade: string; count: number }[];
  trend: { day: string; count: number; avg_score: number }[];
}

export default function OverviewPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [activeModel, setActiveModel] = useState<ModelRun | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<HealthStatus>('/api/health'),
      api.get<{ runs: ModelRun[] }>('/api/train/runs'),
      api.get<Summary>('/api/reports/summary'),
    ])
      .then(([h, { runs }, s]) => {
        setHealth(h);
        setActiveModel(runs.find((r) => r.is_active) ?? null);
        setSummary(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  const trendData = (summary?.trend ?? []).map((t) => ({
    day: new Date(t.day).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: Number(t.count),
    avg: parseFloat(String(t.avg_score)).toFixed(1),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Status chips ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusChip label="System Healthy" active={health?.status === 'ok'} delay={0} />
        <StatusChip label="Database Online" active={!!health?.db} delay={1} />
        <StatusChip label="ML Pipeline Active" active={!!health?.ml_service} delay={2} />
        <StatusChip label={health?.model_version ? `Model v${health.model_version}` : 'No Model'} active={!!health?.model_loaded} delay={3} />
      </div>

      {/* ── Metrics grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
        <MetricCard
          label="Model R²"
          value={activeModel?.r2?.toFixed(3) ?? '—'}
          trend={{ direction: 'up', value: `${((activeModel?.r2 ?? 0) * 100).toFixed(0)}%` }}
          sub="coefficient of determination"
          icon={<Brain size={18} />}
          delay={0}
        />
        <MetricCard
          label="Mean Absolute Error"
          value={activeModel?.mae?.toFixed(2) ?? '—'}
          unit="pts"
          trend={{ direction: 'down', value: `${((activeModel?.mae ?? 0) > 0 ? (activeModel!.mae / 3).toFixed(2) : '0.00')}` }}
          sub="lower is better"
          icon={<Target size={18} />}
          delay={1}
        />
        <MetricCard
          label="RMSE"
          value={activeModel?.rmse?.toFixed(2) ?? '—'}
          unit="pts"
          trend={{ direction: 'down', value: `${((activeModel?.rmse ?? 0) > 0 ? (activeModel!.rmse / 4).toFixed(2) : '0.00')}` }}
          sub="root mean square error"
          icon={<Activity size={18} />}
          delay={2}
        />
        <MetricCard
          label="Total Predictions"
          value={summary?.total_predictions ?? 0}
          trend={{ direction: 'up', value: '+12%' }}
          sub="all time"
          icon={<TrendingUp size={18} />}
          delay={3}
        />
      </div>

      {/* ── Main area: Hero Chart + AI Insights ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <HeroChart data={trendData} />
        <AIInsightsPanel
          modelR2={activeModel?.r2 ?? 0}
          mae={activeModel?.mae ?? 0}
          rmse={activeModel?.rmse ?? 0}
        />
      </div>

      {/* ── Secondary area: Charts + Grade Distribution ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <RegressionChart />
        <PerformanceChart />
        {summary && summary.by_grade.length > 0 && (
          <GradeDonut grades={summary.by_grade} />
        )}
      </div>

      {/* ── Recent predictions table ── */}
      <PredictionsTable />
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status bar skeleton */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[120, 130, 140, 130].map((w, i) => (
          <div
            key={i}
            style={{
              height: 38, width: w, borderRadius: 999,
              background: 'rgba(26,50,99,0.06)',
              animation: 'pulse 1.8s ease-in-out infinite',
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      {/* Cards skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 130, borderRadius: 24,
              background: 'rgba(26,50,99,0.06)',
              animation: 'pulse 1.8s ease-in-out infinite',
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
      {/* Chart skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ height: 280, borderRadius: 24, background: 'rgba(26,50,99,0.06)' }} />
        <div style={{ height: 280, borderRadius: 24, background: 'rgba(26,50,99,0.06)' }} />
      </div>
    </div>
  );
}
