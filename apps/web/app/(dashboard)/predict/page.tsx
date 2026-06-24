'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api-client';

const schema = z.object({
  attendance_percent: z.number().min(0).max(100),
  study_hours_per_day: z.number().min(0).max(24),
  previous_score: z.number().min(0).max(100),
  sleep_hours: z.number().min(0).max(24),
});
type FormValues = z.infer<typeof schema>;

interface Result {
  predicted_score: number;
  grade: string;
  model_version: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#F5F5F5', B: '#C0C0C0', C: '#888888', D: '#585858', F: '#383838',
};

const INPUTS: {
  key: keyof FormValues;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  help: string;
}[] = [
  { key: 'attendance_percent', label: 'Attendance', min: 0, max: 100, step: 1, unit: '%', help: 'Class attendance rate' },
  { key: 'study_hours_per_day', label: 'Study hours / day', min: 0, max: 24, step: 0.5, unit: 'hrs', help: 'Average daily study time' },
  { key: 'previous_score', label: 'Previous score', min: 0, max: 100, step: 1, unit: 'pts', help: 'Last exam score' },
  { key: 'sleep_hours', label: 'Sleep hours / night', min: 0, max: 24, step: 0.5, unit: 'hrs', help: 'Average nightly sleep' },
];

// Animated SVG gauge
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const R = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * R; // half circle
  const pct = score / 100;
  const fillLen = circumference * pct;
  const color = GRADE_COLORS[grade] ?? '#F5F5F5';

  return (
    <svg
      viewBox="0 0 200 120"
      style={{ width: '100%', maxWidth: 280, display: 'block', margin: '0 auto' }}
      aria-label={`Predicted score: ${score}`}
    >
      {/* Track */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none"
        stroke="#1C2B3E"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${fillLen} ${circumference}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.4s ease' }}
      />
      {/* Glow */}
      <path
        d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${fillLen} ${circumference}`}
        opacity="0.3"
        style={{ filter: 'blur(3px)', transition: 'stroke-dasharray 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-pixel)', fontWeight: 700, fontSize: 36, fill: '#F5F5F5' }}
      >
        {score.toFixed(1)}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: '#3C3C3C', letterSpacing: '0.15em', textTransform: 'uppercase' }}
      >
        out of 100
      </text>
    </svg>
  );
}

let debounceTimer: ReturnType<typeof setTimeout>;

export default function PredictPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { attendance_percent: 85, study_hours_per_day: 5, previous_score: 75, sleep_hours: 7 },
  });

  const runPrediction = useCallback(async (data: FormValues) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<Result>('/api/predict', data);
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced slider prediction
  const onSliderChange = useCallback(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      handleSubmit(runPrediction)();
    }, 350);
  }, [handleSubmit, runPrediction]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <p className="data-label" style={{ marginBottom: 6 }}>Inference</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
          Predict score
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Inputs */}
        <div className="card" style={{ padding: '28px 28px' }}>
          <form onSubmit={handleSubmit(runPrediction)} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {INPUTS.map(({ key, label, min, max, step, unit, help }) => (
                <Controller
                  key={key}
                  name={key}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <label htmlFor={key} className="data-label">{label}</label>
                          <p style={{ fontSize: 12, color: '#3C3C3C', marginTop: 2 }}>{help}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            id={`${key}-num`}
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                              onSliderChange();
                            }}
                            style={{
                              width: 64,
                              background: '#1A1A1A',
                              border: '1px solid #1C2B3E',
                              borderRadius: 0,
                              padding: '4px 8px',
                              color: '#F5F5F5',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              fontWeight: 600,
                              textAlign: 'right',
                            }}
                          />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3C3C3C', minWidth: 24 }}>
                            {unit}
                          </span>
                        </div>
                      </div>
                      <input
                        id={key}
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value));
                          onSliderChange();
                        }}
                        style={{
                          width: '100%',
                          height: 4,
                          accentColor: '#F5F5F5',
                          cursor: 'pointer',
                        }}
                        aria-label={label}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={field.value}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3C3C3C' }}>{min}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#3C3C3C' }}>{max}</span>
                      </div>
                      {errors[key] && (
                        <p style={{ color: '#B0B0B0', fontSize: 12, marginTop: 4 }}>
                          {errors[key]?.message as string}
                        </p>
                      )}
                    </div>
                  )}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 32 }}
            >
              {loading ? 'Predicting…' : 'Run prediction'}
            </button>
          </form>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 16,
                background: 'rgba(245,245,245,0.1)',
                border: '1px solid rgba(245,245,245,0.3)',
                borderRadius: 2,
                padding: '10px 14px',
                color: '#B0B0B0',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Result panel */}
        <div className="card" style={{ padding: '28px 20px', textAlign: 'center' }}>
          {result ? (
            <div className="animate-slide-up">
              <p className="data-label" style={{ marginBottom: 20 }}>Predicted outcome</p>
              <ScoreGauge score={result.predicted_score} grade={result.grade} />
              <div style={{ marginTop: 20 }}>
                <span className={`grade-badge grade-${result.grade}`} style={{ width: 48, height: 48, fontSize: 20 }}>
                  {result.grade}
                </span>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: '#3C3C3C', fontFamily: 'var(--font-mono)' }}>
                Grade {result.grade}
              </p>
              <div
                style={{
                  marginTop: 20,
                  padding: '10px 14px',
                  background: '#1A1A1A',
                  borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#3C3C3C',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                }}
              >
                <div>model_version: {result.model_version}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '48px 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #1C2B3E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C3C3C" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p style={{ color: '#3C3C3C', fontSize: 14 }}>Adjust the inputs or</p>
              <p style={{ color: '#3C3C3C', fontSize: 14 }}>click Run prediction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
