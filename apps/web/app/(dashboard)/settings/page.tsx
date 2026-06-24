'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { CheckCircle, LogOut } from 'lucide-react';

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/\d/, 'Must contain at least one number'),
});
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) });

  const onChangePassword = async (data: ChangePasswordValues) => {
    setPwError('');
    setPwSuccess(false);
    try {
      await api.post('/api/auth/change-password', data);
      setPwSuccess(true);
      reset();
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 32 }}>
        <p className="data-label" style={{ marginBottom: 6 }}>Account</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: '#F5F5F5', margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* Account info */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#F5F5F5', marginBottom: 20 }}>
          Account information
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
            { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="data-label" style={{ marginBottom: 6 }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-display)', color: '#F5F5F5', fontWeight: 500 }}>{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#F5F5F5', marginBottom: 20 }}>
          Change password
        </p>

        {pwSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#D0D0D0', marginBottom: 20, fontSize: 14 }}>
            <CheckCircle size={16} />
            Password updated successfully.
          </div>
        )}

        {pwError && (
          <div role="alert" style={{ marginBottom: 20, background: 'rgba(245,245,245,0.08)', border: '1px solid rgba(245,245,245,0.25)', borderRadius: 2, padding: '10px 14px', color: '#B0B0B0', fontSize: 13 }}>
            {pwError}
          </div>
        )}

        <form onSubmit={handleSubmit(onChangePassword)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(
            [
              { id: 'current_password', label: 'Current password', key: 'current_password' as const },
              { id: 'new_password', label: 'New password', key: 'new_password' as const },
            ]
          ).map(({ id, label, key }) => (
            <div key={id}>
              <label htmlFor={id} className="data-label" style={{ display: 'block', marginBottom: 8 }}>{label}</label>
              <input id={id} type="password" className="form-input" autoComplete="current-password" {...register(key)} aria-invalid={!!errors[key]} />
              {errors[key] && <p style={{ color: '#B0B0B0', fontSize: 12, marginTop: 4 }}>{errors[key]?.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ padding: '24px 28px', borderColor: 'rgba(239,68,68,0.2)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: '#F5F5F5', marginBottom: 8 }}>
          Sign out
        </p>
        <p style={{ color: '#3C3C3C', fontSize: 14, marginBottom: 16 }}>
          You will be redirected to the login page.
        </p>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 2, border: '1px solid rgba(245,245,245,0.3)', background: 'rgba(239,68,68,0.06)', color: '#B0B0B0', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, transition: 'all 150ms ease' }}>
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}
