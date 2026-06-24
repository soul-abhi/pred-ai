'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { CheckCircle, Loader, AlertCircle, TrendingUp } from 'lucide-react';

interface Dataset { id: string; filename: string; row_count: number; uploaded_at: string; }
interface ModelRun {
  id: string; mae: number; rmse: number; r2: number;
  cv_r2_mean: number; cv_r2_std: number; model_version: string;
  is_active: boolean; trained_at: string; winner?: string;
}
interface TrainResult { model_run: ModelRun; training_metrics: Record<string, unknown>; }

function MetricPair({ label, before, after, lowerBetter }: {
  label: string; before: number | null; after: number; lowerBetter?: boolean;
}) {
  const improved = before === null
    ? true
    : lowerBetter ? after < before : after > before;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="data-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        {before !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', color: '#3C3C3C', fontSize: 16 }}>
            {before.toFixed(3)}
          </span>
        )}
        {before !== null && <span style={{ color: '#3C3C3C' }}>→</span>}
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700,
          color: improved ? '#D0D0D0' : '#585858',
        }}>
          {after.toFixed(3)}
        </span>
        {before !== null && (
          <span style={{ fontSize: 11, color: improved ? '#D0D0D0' : '#585858' }}>
            {improved ? '▲' : '▼'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TrainPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('synthetic');
  const [activeModel, setActiveModel] = useState<ModelRun | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);
  const [training, setTraining] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState('');
  const [promoted, setPromoted] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ datasets: Dataset[] }>('/api/datasets'),
      api.get<{ runs: ModelRun[] }>('/api/train/runs'),
    ]).then(([{ datasets: ds }, { runs }]) => {
      setDatasets(ds);
      setActiveModel(runs.find((r) => r.is_active) ?? null);
    }).catch(console.error);
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setError('');
    setResult(null);
    setPromoted(false);
    try {
      const body =
        selectedDataset === 'synthetic'
          ? { use_synthetic: true }
          : { dataset_id: selectedDataset };
      const res = await api.post<TrainResult>('/api/train', body);
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handlePromote = async () => {
    if (!result) return;
    setPromoting(true);
    try {
      await api.post('/api/train/promote', { model_run_id: result.model_run.id });
      setActiveModel(result.model_run);
      setPromoted(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Promote failed');
    } finally {
      setPromoting(false);
    }
  };

  const newModel = result?.model_run;
  const improved = newModel
    ? activeModel === null || newModel.r2 > activeModel.r2
    : false;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <p className="data-label" style={{ marginBottom: 6 }}>Model</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
          Train model
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Config card */}
        <div className="card" style={{ padding: '28px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#F5F5F5', marginBottom: 20 }}>
            Training configuration
          </p>

          <div style={{ marginBottom: 24 }}>
            <label className="data-label" htmlFor="dataset-select" style={{ display: 'block', marginBottom: 10 }}>
              Dataset
            </label>
            <select
              id="dataset-select"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="form-input"
              style={{ cursor: 'pointer' }}
            >
              <option value="synthetic">Default synthetic data (500 rows)</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.filename} ({ds.row_count.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              padding: '12px 16px',
              background: '#1A1A1A',
              borderRadius: 2,
              marginBottom: 24,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#3C3C3C',
            }}
          >
            <div style={{ marginBottom: 4 }}>3 candidates: LinearRegression · RandomForest · XGBoost</div>
            <div>5-fold cross-validation · best R² wins</div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleTrain}
            disabled={training}
          >
            {training ? (
              <>
                <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                Training… this takes a few seconds
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                Train model
              </>
            )}
          </button>

          {error && (
            <div role="alert" style={{ marginTop: 16, display: 'flex', gap: 10, background: 'rgba(245,245,245,0.08)', border: '1px solid rgba(245,245,245,0.25)', borderRadius: 2, padding: '12px 16px', color: '#B0B0B0', fontSize: 13 }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Results card */}
        <div className="card" style={{ padding: '28px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#F5F5F5', marginBottom: 20 }}>
            {result ? 'New model results' : 'Active model'}
          </p>

          {!result && !activeModel && (
            <p style={{ color: '#3C3C3C', fontSize: 14 }}>No model trained yet.</p>
          )}

          {!result && activeModel && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <MetricPair label="R²" before={null} after={activeModel.r2} />
              <MetricPair label="MAE" before={null} after={activeModel.mae} lowerBetter />
              <MetricPair label="RMSE" before={null} after={activeModel.rmse} lowerBetter />
            </div>
          )}

          {result && newModel && (
            <div className="animate-slide-up">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
                <MetricPair label="R²" before={activeModel?.r2 ?? null} after={newModel.r2} />
                <MetricPair label="MAE" before={activeModel?.mae ?? null} after={newModel.mae} lowerBetter />
                <MetricPair label="RMSE" before={activeModel?.rmse ?? null} after={newModel.rmse} lowerBetter />
              </div>

              <div style={{ marginBottom: 20, padding: '10px 14px', background: '#1A1A1A', borderRadius: 2 }}>
                <p className="data-label" style={{ marginBottom: 6 }}>CV R² (5-fold)</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#F5F5F5' }}>
                  {newModel.cv_r2_mean.toFixed(3)}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3C3C3C', marginLeft: 6 }}>
                  ± {newModel.cv_r2_std.toFixed(3)}
                </span>
              </div>

              {!promoted ? (
                <div>
                  {!improved && (
                    <p style={{ color: '#888888', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={14} />
                      New model is weaker than the active one — promote only if intentional.
                    </p>
                  )}
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handlePromote}
                    disabled={promoting}
                  >
                    {promoting ? 'Promoting…' : `Promote to active${improved ? ' ✓' : ''}`}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D0D0D0', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  <CheckCircle size={18} />
                  Model promoted — now serving predictions
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
