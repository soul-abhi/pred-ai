import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  getUserById,
  getUserByEmail,
} from '../services/auth.service';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { env } from '../config/env';

const router = Router();

const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict' as const,
  path: '/',
};

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, {
    ...cookieOpts,
    maxAge: env.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearTokenCookies(res: Response) {
  res.clearCookie('access_token', cookieOpts);
  res.clearCookie('refresh_token', cookieOpts);
}

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/signup', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = signupSchema.parse(req.body);

    const existing = await getUserByEmail(body.email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(body.password);

    const [user] = await db
      .insert(users)
      .values({ email: body.email, password_hash: passwordHash, name: body.name })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role, created_at: users.created_at });

    const accessToken = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.created_at },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await getUserByEmail(body.email);
    const isValid = user ? await verifyPassword(body.password, user.password_hash) : false;

    if (!user || !isValid) {
      // Generic message — never reveal whether email exists
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const accessToken = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    setTokenCookies(res, accessToken, refreshToken);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.created_at },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldToken = req.cookies?.refresh_token as string | undefined;
    if (!oldToken) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const result = await rotateRefreshToken(oldToken);
    if (!result) {
      clearTokenCookies(res);
      res.status(401).json({ error: 'Refresh token invalid or expired' });
      return;
    }

    const user = await getUserById(result.userId);
    if (!user) {
      clearTokenCookies(res);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = issueAccessToken({ sub: user.id, email: user.email, role: user.role });
    setTokenCookies(res, accessToken, result.newToken);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    if (token) await revokeRefreshToken(token);
    clearTokenCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Must contain at least one number'),
});

router.post('/change-password', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = changePasswordSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.sub)).limit(1);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const valid = await verifyPassword(body.current_password, user.password_hash);
    if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

    const newHash = await hashPassword(body.new_password);
    await db.update(users).set({ password_hash: newHash, updated_at: new Date() }).where(eq(users.id, user.id));

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
