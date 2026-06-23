import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../db/client';
import { predictions } from '../db/schema';
import { eq, and, gte, lte, count, desc, asc, sql } from 'drizzle-orm';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']).optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  sort: z.enum(['created_at', 'predicted_score']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = querySchema.parse(req.query);
    const offset = (q.page - 1) * q.per_page;

    const conditions = [eq(predictions.user_id, req.user!.sub)];
    if (q.grade) conditions.push(eq(predictions.grade, q.grade));
    if (q.date_from) conditions.push(gte(predictions.created_at, new Date(q.date_from)));
    if (q.date_to) conditions.push(lte(predictions.created_at, new Date(q.date_to)));

    const where = and(...conditions);
    const orderCol = q.sort === 'predicted_score' ? predictions.predicted_score : predictions.created_at;
    const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

    const [{ total }] = await db
      .select({ total: count() })
      .from(predictions)
      .where(where);

    const rows = await db
      .select()
      .from(predictions)
      .where(where)
      .orderBy(orderDir)
      .limit(q.per_page)
      .offset(offset);

    res.json({
      data: rows,
      total,
      page: q.page,
      per_page: q.per_page,
      total_pages: Math.ceil(total / q.per_page),
    });
  } catch (err) {
    next(err);
  }
});

// CSV export — streams the full filtered result set
router.get('/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = querySchema.omit({ page: true, per_page: true }).parse(req.query);

    const conditions = [eq(predictions.user_id, req.user!.sub)];
    if (q.grade) conditions.push(eq(predictions.grade, q.grade));
    if (q.date_from) conditions.push(gte(predictions.created_at, new Date(q.date_from)));
    if (q.date_to) conditions.push(lte(predictions.created_at, new Date(q.date_to)));

    const rows = await db
      .select()
      .from(predictions)
      .where(and(...conditions))
      .orderBy(desc(predictions.created_at));

    const header = 'id,attendance_percent,study_hours_per_day,previous_score,sleep_hours,predicted_score,grade,created_at\n';
    const csvRows = rows
      .map((r) =>
        [
          r.id,
          r.attendance_percent,
          r.study_hours_per_day,
          r.previous_score,
          r.sleep_hours,
          r.predicted_score,
          r.grade,
          r.created_at.toISOString(),
        ].join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="predictions_${Date.now()}.csv"`);
    res.send(header + csvRows);
  } catch (err) {
    next(err);
  }
});

// Summary stats for analytics page
router.get('/summary', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub;

    const [totals] = await db
      .select({ total: count() })
      .from(predictions)
      .where(eq(predictions.user_id, userId));

    const byGrade = await db
      .select({ grade: predictions.grade, count: count() })
      .from(predictions)
      .where(eq(predictions.user_id, userId))
      .groupBy(predictions.grade);

    // Trend: last 30 days, grouped by day
    const trend = await db.execute(sql`
      SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as count, AVG(predicted_score) as avg_score
      FROM predictions
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    res.json({
      total_predictions: totals.total,
      by_grade: byGrade,
      trend: trend.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
