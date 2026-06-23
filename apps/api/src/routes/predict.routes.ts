import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { mlPredict } from '../services/mlClient.service';
import { db } from '../db/client';
import { predictions, modelRuns } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { Grade } from '@pred-ai/shared-types';

const router = Router();

const predictSchema = z.object({
  attendance_percent: z.number().min(0).max(100),
  study_hours_per_day: z.number().min(0).max(24),
  previous_score: z.number().min(0).max(100),
  sleep_hours: z.number().min(0).max(24),
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = predictSchema.parse(req.body);
    const result = await mlPredict(input);

    // Find the active model run to link
    const [activeModel] = await db
      .select({ id: modelRuns.id })
      .from(modelRuns)
      .where(and(eq(modelRuns.is_active, true)))
      .limit(1);

    await db.insert(predictions).values({
      user_id: req.user!.sub,
      model_run_id: activeModel?.id ?? null,
      attendance_percent: input.attendance_percent,
      study_hours_per_day: input.study_hours_per_day,
      previous_score: input.previous_score,
      sleep_hours: input.sleep_hours,
      predicted_score: result.predicted_score,
      grade: result.grade as Grade,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
