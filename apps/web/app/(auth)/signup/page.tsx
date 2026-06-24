'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import LivePredictionStream from '@/components/ui/LivePredictionStream';
import { AuthProvider } from '@/lib/auth-context';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/\d/, 'Must contain at least one number'),
});
type FormValues = z.infer<typeof schema>;

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    try {
      await signup(data.email, data.password, data.name);
      router.push('/overview');
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#3D434B' }}>
      {/* Left — form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:max-w-[480px]" style={{ backgroundColor: '#2B2F33' }}>
        <div className="mb-10">
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 22,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            pred<span style={{ color: '#FE413C' }}>AI</span>
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 32,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}
        >
          Create account
        </h1>
        <p style={{ color: '#9CA0A6', fontSize: 15, marginBottom: 36 }}>
          Already have one?{' '}
          <Link href="/login" style={{ color: '#FE413C', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>

        {serverError && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(254,65,60,0.1)',
              border: '1px solid rgba(254,65,60,0.3)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#FE817D',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(
            [
              { id: 'name', label: 'Full name', type: 'text', autoComplete: 'name', placeholder: 'Ada Lovelace', key: 'name' },
              { id: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com', key: 'email' },
              { id: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', placeholder: '8+ chars, one number', key: 'password' },
            ] as const
          ).map(({ id, label, type, autoComplete, placeholder, key }) => (
            <div key={key}>
              <label
                htmlFor={id}
                style={{
                  display: 'block',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#9CA0A6',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 8,
                }}
              >
                {label}
              </label>
              <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                className="form-input"
                placeholder={placeholder}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `${id}-err` : undefined}
                {...register(key)}
              />
              {errors[key] && (
                <p id={`${id}-err`} style={{ color: '#FE817D', fontSize: 13, marginTop: 6 }}>
                  {errors[key]?.message}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>
      </div>

      {/* Right — live prediction stream */}
      <div
        className="hidden lg:block flex-1 relative overflow-hidden"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <LivePredictionStream />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function SignupPage() {
  return (
    <AuthProvider>
      <SignupForm />
    </AuthProvider>
  );
}
