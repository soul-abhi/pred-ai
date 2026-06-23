import { env } from '../config/env';
import type { PredictInput, PredictResult } from '@pred-ai/shared-types';

const ML_TIMEOUT_MS = 10_000;

// Simple in-memory short-TTL cache for rarely-changing reads
const cache = new Map<string, { value: unknown; expiresAt: number }>();

function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value as T;
}

function setCache(key: string, value: unknown, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function mlFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${env.ML_SERVICE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    if (!res.ok) {
      const body = await res.text();
      throw Object.assign(new Error(`ML service error ${res.status}: ${body}`), {
        status: res.status >= 500 ? 503 : res.status,
      });
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw Object.assign(new Error('ML service timed out'), { status: 503 });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function mlPredict(input: PredictInput): Promise<PredictResult> {
  return mlFetch<PredictResult>('/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function mlTrain(payload: {
  dataset_path?: string;
  use_synthetic?: boolean;
}): Promise<Record<string, unknown>> {
  cache.delete('feature-importance');
  return mlFetch('/train', { method: 'POST', body: JSON.stringify(payload) });
}

export async function mlHealth(): Promise<{
  status: string;
  model_loaded: boolean;
  model_version: string | null;
}> {
  return mlFetch('/health');
}

export async function mlFeatureImportance(): Promise<Record<string, number>> {
  const cached = getCache<Record<string, number>>('feature-importance');
  if (cached) return cached;

  const result = await mlFetch<{ feature_importance: Record<string, number> }>('/feature-importance');
  setCache('feature-importance', result.feature_importance, 5 * 60_000);
  return result.feature_importance;
}
