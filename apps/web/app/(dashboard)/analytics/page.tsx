'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { api } from '@/lib/api-client';

interface FeatureImportance { feature: string; importance: number; }
interface ModelRun {
  id: string; mae: number; rmse: number; r2: number;
  cv_r2_mean: number; is_active: boolean; trained_at: string;
}
interface Summary {
  total_predictions: number;
  by_grade: { grade: string; count: number }[];
}

const FEATURE_LABELS: Record<string, string> = {
  attendance_percent: 'Attendance',
  study_hours_per_day: 'Study hrs',
  previous_score: 'Prev score',
  sleep_hours: 'Sleep hrs',
};

const GRADE_COLORS: Record<string, string> = {
  A: '#F5F5F5', B: '#C0C0C0', C: '#888888', D: '#585858', F: '#383838',
};

export default function AnalyticsPage() {
  const [fi, setFi] = useState<FeatureImportance[]>([]);
  const [runs, setRuns] = useState<ModelRun[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ feature_importance: Record<string, number> }>('/api/train/feature-importance').catch(() => ({ feature_importance: {} })),
      api.get<{ runs: ModelRun[] }>('/api/train/runs'),
      api.get<Summary>('/api/reports/summary'),
    ]).then(([{ feature_importance }, { runs: r }, s]) => {
      setFi(
        Object.entries(feature_importance)
          .map(([feature, importance]) => ({ feature: FEATURE_LABELS[feature] ?? feature, importance: parseFloat((importance * 100).toFixed(1)) }))
          .sort((a, b) => b.importance - a.importance)
      );
      setRuns(r.map((run) => ({ ...run, trained_at: new Date(run.trained_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) })));
      setSummary(s);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#3C3C3C', padding: 40 }}>Loading analytics…</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <p className="data-label" style={{ marginBottom: 6 }}>Insights</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
          Analytics
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Feature importance */}
        <div className="card" style={{ padding: '24px' }}>
          <p className="data-label" style={{ marginBottom: 20 }}>Feature importance</p>
          {fi.length === 0 ? (
            <p style={{ color: '#3C3C3C', fontSize: 14, padding: '32px 0' }}>
              Train a model to see feature importances.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fi} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 12, fill: '#707070' }} width={80} />
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, 'Importance']}
                  contentStyle={{ background: '#0E0E0E', border: '1px solid #1C2B3E', borderRadius: 2 }}
                  labelStyle={{ color: '#F5F5F5', fontFamily: 'var(--font-display)', fontSize: 12 }}
                  itemStyle={{ color: '#F5F5F5', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <Bar dataKey="importance" fill="#F5F5F5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Grade distribution */}
        <div className="card" style={{ padding: '24px' }}>
          <p className="data-label" style={{ marginBottom: 20 }}>Prediction distribution by grade</p>
          {!summary || summary.by_grade.length === 0 ? (
            <p style={{ color: '#3C3C3C', fontSize: 14, padding: '32px 0' }}>No predictions yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={summary.by_grade.map((g) => ({
                  ...g,
                  count: Number(g.count),
                  fill: GRADE_COLORS[g.grade] ?? '#707070',
                }))}
                margin={{ left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 13, fill: '#707070' }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#0E0E0E', border: '1px solid #1C2B3E', borderRadius: 2 }}
                  itemStyle={{ color: '#F5F5F5', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                />
                <Bar dataKey="count" name="Predictions" fill="#F5F5F5" radius={[4, 4, 0, 0]}>
                  {summary.by_grade.map((g) => (
                    <rect key={g.grade} fill={GRADE_COLORS[g.grade] ?? '#F5F5F5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model runs comparison */}
      {runs.length > 1 && (
        <div className="card" style={{ padding: '24px' }}>
          <p className="data-label" style={{ marginBottom: 20 }}>R² over training runs</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={runs} margin={{ left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="trained_at" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#0E0E0E', border: '1px solid #1C2B3E', borderRadius: 2 }}
                labelStyle={{ color: '#F5F5F5', fontSize: 12 }}
                itemStyle={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} />
              <Line type="monotone" dataKey="r2" name="R²" stroke="#F5F5F5" strokeWidth={2} dot={{ fill: '#F5F5F5', r: 4 }} />
              <Line type="monotone" dataKey="cv_r2_mean" name="CV R² mean" stroke="#707070" strokeWidth={1.5} strokeDasharray="2 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
