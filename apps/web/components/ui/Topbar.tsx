'use client';

import { Search, Bell, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/overview':  'Overview',
  '/predict':   'Predict',
  '/upload':    'Upload Data',
  '/train':     'Train Model',
  '/analytics': 'Analytics',
  '/reports':   'Reports',
  '/settings':  'Settings',
};

export default function Topbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Dashboard';

  return (
    <header
      style={{
        height: 64,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: 12,
        background: '#FFFFFF',
        borderBottom: '1px solid rgba(26,50,99,0.08)',
      }}
    >
      {/* Page title + breadcrumb */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            color: '#1A3263',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'rgba(26,50,99,0.35)',
            marginTop: 1,
          }}
        >
          <span>Dashboard</span>
          <span style={{ color: 'rgba(26,50,99,0.20)' }}>/</span>
          <span style={{ color: 'rgba(26,50,99,0.55)' }}>{title}</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#FBF7F5',
          border: '1px solid rgba(26,50,99,0.10)',
          borderRadius: 10,
          padding: '8px 14px',
          minWidth: 180,
          cursor: 'text',
        }}
      >
        <Search size={14} color="rgba(26,50,99,0.30)" strokeWidth={2} />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'rgba(26,50,99,0.30)',
            userSelect: 'none',
          }}
        >
          Search...
        </span>
      </div>

      {/* Notifications */}
      <button
        aria-label="Notifications"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: '1px solid rgba(26,50,99,0.10)',
          background: '#FBF7F5',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,50,99,0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FBF7F5'; }}
      >
        <Bell size={15} color="rgba(26,50,99,0.50)" strokeWidth={1.75} />
        <span style={{
          position: 'absolute', top: 8, right: 8,
          width: 6, height: 6, borderRadius: '50%',
          background: '#FAB95B',
          border: '1.5px solid #FFFFFF',
        }} />
      </button>

      {/* New action */}
      <button
        className="btn-primary"
        style={{ gap: 6, padding: '8px 16px', fontSize: 13 }}
      >
        <Plus size={13} strokeWidth={2.5} />
        New
      </button>

      {/* Avatar */}
      {user && (
        <div
          aria-label={user.name}
          title={user.name}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#1A3263',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
    </header>
  );
}
