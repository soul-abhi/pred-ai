'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Zap, Upload, Settings2,
  BarChart2, FileText, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/overview',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/predict',   label: 'Predict',     icon: Zap },
  { href: '/upload',    label: 'Upload',      icon: Upload },
  { href: '/train',     label: 'Train',       icon: Settings2 },
  { href: '/analytics', label: 'Analytics',   icon: BarChart2 },
  { href: '/reports',   label: 'Reports',     icon: FileText },
  { href: '/settings',  label: 'Settings',    icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/overview' && pathname.startsWith(href + '/'));

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: '#FFFFFF',
        borderRight: '1px solid rgba(26,50,99,0.08)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 16px 20px',
      }}
    >
      {/* Logo */}
      <div style={{ paddingLeft: 6, paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#1A3263',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="4" height="14" rx="1" fill="white"/>
              <rect x="6" y="2" width="10" height="4" rx="1" fill="white" opacity="0.7"/>
              <rect x="6" y="8" width="8" height="4" rx="1" fill="white" opacity="0.45"/>
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 17,
                color: '#1A3263',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              pred<span style={{ color: '#FAB95B' }}>AI</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'rgba(26,50,99,0.35)',
                marginTop: 1,
              }}
            >
              Analytics Platform
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(26,50,99,0.07)', marginBottom: 12 }} />

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`sidebar-link${active ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 1.75} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(26,50,99,0.07)', margin: '12px 0' }} />

      {/* User footer */}
      {user && (
        <div style={{ paddingLeft: 6, marginBottom: 8 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#1A3263',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 12,
              color: '#FFFFFF',
              marginBottom: 6,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: '#1A3263',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: 'rgba(26,50,99,0.40)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.email}
          </div>
        </div>
      )}
      <button
        onClick={handleLogout}
        className="sidebar-link"
        aria-label="Sign out"
      >
        <LogOut size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        Sign out
      </button>
    </aside>
  );
}
