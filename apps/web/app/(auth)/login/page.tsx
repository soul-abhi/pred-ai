'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { AuthProvider } from '@/lib/auth-context';
import { CharactersAnimation, CircleAnimation } from '@/components/ui/page-not-found';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

function Spinner() {
  return (
    <svg
      style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/overview';
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      router.push(redirect);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  /* ── input style — transparent, black border + text ── */
  const inputBase: React.CSSProperties = {
    width: '100%',
    paddingLeft: 44,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 12,
    background: 'transparent',
    border: '1.5px solid rgba(0,0,0,0.45)',
    color: '#000000',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 150ms ease',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* animations — white circles sweep in from right, figures run across */}
      <CharactersAnimation />
      <CircleAnimation />

      {/* transparent card — black text invisible on black bg,
          revealed as white circles pass underneath */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
          width: 420,
          maxWidth: '90%',
          animation: 'fadeIn 0.5s ease-out 1s both',
        }}
      >
        <div style={{ background: 'transparent', padding: '40px 36px' }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: '#000000',
                letterSpacing: '-0.02em',
                marginBottom: 14,
              }}
            >
              pred<span style={{ color: '#FE413C' }}>AI</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 32,
                color: '#000000',
                letterSpacing: '-0.04em',
                margin: '0 0 8px',
              }}
            >
              Welcome Back
            </h1>
            <p style={{ color: 'rgba(0,0,0,0.55)', fontSize: 14, fontWeight: 500 }}>
              Sign in to continue
            </p>
          </div>

          {/* Server error */}
          {serverError && (
            <div
              role="alert"
              style={{
                border: '1.5px solid rgba(0,0,0,0.5)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#000000',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {serverError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Email */}
            <div>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(0,0,0,0.45)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  aria-label="Email address"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-err' : undefined}
                  {...register('email')}
                  style={{
                    ...inputBase,
                    border: errors.email
                      ? '1.5px solid #000000'
                      : '1.5px solid rgba(0,0,0,0.45)',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#000000'; }}
                  onBlur={(e) => {
                    if (!errors.email)
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(0,0,0,0.45)';
                  }}
                />
              </div>
              {errors.email && (
                <p id="email-err" style={{ color: '#000000', fontSize: 12, fontWeight: 600, marginTop: 6, paddingLeft: 4 }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(0,0,0,0.45)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  aria-label="Password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'pass-err' : undefined}
                  {...register('password')}
                  style={{
                    ...inputBase,
                    border: errors.password
                      ? '1.5px solid #000000'
                      : '1.5px solid rgba(0,0,0,0.45)',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#000000'; }}
                  onBlur={(e) => {
                    if (!errors.password)
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(0,0,0,0.45)';
                  }}
                />
              </div>
              {errors.password && (
                <p id="pass-err" style={{ color: '#000000', fontSize: 12, fontWeight: 600, marginTop: 6, paddingLeft: 4 }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me / Forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(0,0,0,0.55)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input type="checkbox" style={{ accentColor: '#000', cursor: 'pointer' }} />
                Remember me
              </label>
              <Link
                href="/settings"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(0,0,0,0.55)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit — solid black, white text: crisp CTA on white circles */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                paddingTop: 15,
                paddingBottom: 15,
                borderRadius: 12,
                background: '#000000',
                color: '#FFFFFF',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isSubmitting ? 0.6 : 1,
                transition: 'transform 100ms ease, opacity 150ms ease',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
              }}
            >
              {isSubmitting ? (
                <><Spinner />Signing in…</>
              ) : (
                <>Login <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Sign up */}
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: '#000000', fontWeight: 700, textDecoration: 'none', marginLeft: 4 }}>
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
