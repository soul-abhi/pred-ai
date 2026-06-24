'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Download, Filter } from 'lucide-react';
import { api } from '@/lib/api-client';

interface Prediction {
  id: string;
  attendance_percent: number;
  study_hours_per_day: number;
  previous_score: number;
  sleep_hours: number;
  predicted_score: number;
  grade: string;
  created_at: string;
}

interface Paginated {
  data: Prediction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#F5F5F5', B: '#C0C0C0', C: '#888888', D: '#585858', F: '#383838',
};

const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;
type Grade = (typeof GRADES)[number];

export default function ReportsPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [page, setPage] = useState(1);
  const [grade, setGrade] = useState<Grade | ''>('');
  const [sort, setSort] = useState<'created_at' | 'predicted_score'>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '20',
        sort,
        order,
        ...(grade ? { grade } : {}),
      });
      const res = await api.get<Paginated>(`/api/reports?${params}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, grade, sort, order]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSort = (col: 'created_at' | 'predicted_score') => {
    if (sort === col) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setOrder('desc'); }
    setPage(1);
  };

  const handleExport = () => {
    const params = new URLSearchParams({ sort, order, ...(grade ? { grade } : {}) });
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/reports/export?${params}`;
  };

  const SortIcon = ({ col }: { col: 'created_at' | 'predicted_score' }) => {
    if (sort !== col) return null;
    return order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="data-label" style={{ marginBottom: 6 }}>History</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
            Prediction reports
          </h1>
        </div>
        <button className="btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Filter size={14} color="#3C3C3C" />
        <span className="data-label">Grade:</span>
        {(['', ...GRADES] as const).map((g) => (
          <button
            key={g || 'all'}
            onClick={() => { setGrade(g as Grade | ''); setPage(1); }}
            style={{
              padding: '4px 12px',
              borderRadius: 0,
              border: `1px solid ${grade === g ? '#F5F5F5' : 'rgba(255,255,255,0.1)'}`,
              background: grade === g ? 'rgba(245,245,245,0.1)' : 'transparent',
              color: grade === g ? '#F5F5F5' : '#707070',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {g || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {[
                { key: 'attendance', label: 'Attend %' },
                { key: 'study', label: 'Study hrs' },
                { key: 'prev', label: 'Prev score' },
                { key: 'sleep', label: 'Sleep hrs' },
                { key: 'predicted_score', label: 'Prediction', sortable: true },
                { key: 'grade', label: 'Grade' },
                { key: 'created_at', label: 'Date', sortable: true },
              ].map(({ key, label, sortable }) => (
                <th
                  key={key}
                  onClick={sortable ? () => toggleSort(key as 'created_at' | 'predicted_score') : undefined}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#3C3C3C',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                  aria-sort={
                    sortable && sort === key
                      ? order === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {label}
                    {sortable && <SortIcon col={key as 'created_at' | 'predicted_score'} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 0', textAlign: 'center', color: '#3C3C3C' }}>
                  Loading…
                </td>
              </tr>
            ) : !data?.data.length ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 0', textAlign: 'center', color: '#3C3C3C', fontSize: 14 }}>
                  No predictions yet. Head to{' '}
                  <a href="/predict" style={{ color: '#F5F5F5' }}>Predict</a>{' '}
                  to get started.
                </td>
              </tr>
            ) : (
              data.data.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[
                    row.attendance_percent.toFixed(0),
                    row.study_hours_per_day.toFixed(1),
                    row.previous_score.toFixed(0),
                    row.sleep_hours.toFixed(1),
                  ].map((v, i) => (
                    <td key={i} style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#707070', fontSize: 12 }}>
                      {v}
                    </td>
                  ))}
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#F5F5F5', fontSize: 16 }}>
                    {row.predicted_score.toFixed(1)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 0,
                        backgroundColor: `${GRADE_COLORS[row.grade] ?? '#707070'}1A`,
                        color: GRADE_COLORS[row.grade] ?? '#707070',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                      }}
                    >
                      {row.grade}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: '#3C3C3C', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {new Date(row.created_at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #1C2B3E' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3C3C3C' }}>
              {data.total.toLocaleString()} total · page {data.page} of {data.total_pages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-outline"
                style={{ padding: '4px 12px', fontSize: 13 }}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Prev
              </button>
              <button
                className="btn-outline"
                style={{ padding: '4px 12px', fontSize: 13 }}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
