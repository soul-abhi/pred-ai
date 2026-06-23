import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/client';
import { users, refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { env } from '../config/env';
import type { JwtPayload } from '../middleware/auth.middleware';

const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function issueAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRY } as jwt.SignOptions);
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });
}

export async function rotateRefreshToken(
  oldToken: string
): Promise<{ userId: string; newToken: string } | null> {
  const hash = hashToken(oldToken);
  const now = new Date();

  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token_hash, hash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expires_at, now)
      )
    )
    .limit(1);

  if (!record) return null;

  // Revoke old token
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, record.id));

  const newToken = generateRefreshToken();
  await storeRefreshToken(record.user_id, newToken);

  return { userId: record.user_id, newToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const hash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.token_hash, hash));
}

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.created_at,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}
