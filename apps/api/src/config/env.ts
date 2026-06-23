import * as dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET'),
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS ?? '7', 10),
  ML_SERVICE_URL: process.env.ML_SERVICE_URL ?? 'http://localhost:8000',
  WEB_ORIGIN: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
} as const;
