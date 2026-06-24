'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';

interface Dataset {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  uploaded_at: string;
}

interface UploadResult {
  dataset: Dataset;
  columns: string[];
  rows: Record<string, string>[];
}

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large (max 10 MB).');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload<UploadResult>('/api/datasets/upload', fd);
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <p className="data-label" style={{ marginBottom: 6 }}>Data</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
          Upload dataset
        </h1>
        <p style={{ color: '#707070', fontSize: 14, marginTop: 8 }}>
          CSV must have columns: <code style={{ color: '#F5F5F5', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            attendance_percent, study_hours_per_day, previous_score, sleep_hours, final_score
          </code>
        </p>
      </div>

      {/* Drop zone */}
      <div
        className="card"
        role="button"
        tabIndex={0}
        aria-label="Drop CSV file here or click to browse"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          padding: '64px 40px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 200ms ease, background-color 200ms ease',
          borderColor: dragging ? '#F5F5F5' : undefined,
          backgroundColor: dragging ? 'rgba(245,245,245,0.04)' : undefined,
          borderStyle: 'dashed',
        }}
      >
        <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} style={{ display: 'none' }} />
        {uploading ? (
          <div>
            <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#F5F5F5', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#707070', fontSize: 14 }}>Uploading…</p>
          </div>
        ) : (
          <>
            <UploadIcon size={40} color="#3C3C3C" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#F5F5F5', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              Drop a CSV here
            </p>
            <p style={{ color: '#3C3C3C', fontSize: 13 }}>
              or click to browse — max 10 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(245,245,245,0.08)',
            border: '1px solid rgba(245,245,245,0.25)',
            borderRadius: 2,
            padding: '12px 16px',
            color: '#B0B0B0',
            fontSize: 14,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Preview */}
      {result && (
        <div className="animate-slide-up" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <CheckCircle size={18} color="#D0D0D0" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#F5F5F5' }}>
              {result.dataset.filename}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3C3C3C' }}>
              {result.dataset.row_count.toLocaleString()} rows · {result.dataset.column_count} cols
            </span>
          </div>

          <div className="card" style={{ overflowX: 'auto', borderRadius: 2 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {result.columns.map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#3C3C3C',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {result.columns.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: '10px 16px',
                          color: '#707070',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                        }}
                      >
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ padding: '10px 16px', color: '#3C3C3C', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Showing first 5 rows of {result.dataset.row_count.toLocaleString()}
            </p>
          </div>

          <p style={{ marginTop: 12, color: '#707070', fontSize: 14 }}>
            Dataset saved. Head to{' '}
            <a href="/train" style={{ color: '#F5F5F5' }}>Train</a>{' '}
            to retrain the model on this data.
          </p>
        </div>
      )}
    </div>
  );
}
