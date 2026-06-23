import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { mlTrain, mlFeatureImportance } from '../services/mlClient.service';
import { db } from '../db/client';
import { modelRuns, datasets } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const trainSchema = z.object({
  dataset_id: z.string().uuid().optional(),
  use_synthetic: z.boolean().optional().default(false),
});

const promoteSchema = z.object({ model_run_id: z.string().uuid() });

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = trainSchema.parse(req.body);

    let datasetPath: string | undefined;
    let datasetId: string | undefined;

    if (body.dataset_id) {
      const [ds] = await db
        .select()
        .from(datasets)
        .where(eq(datasets.id, body.dataset_id))
        .limit(1);

      if (!ds || ds.user_id !== req.user!.sub) {
        res.status(404).json({ error: 'Dataset not found' });
        return;
      }
      datasetPath = ds.storage_path;
      datasetId = ds.id;
    }

    const mlResult = await mlTrain({
      dataset_path: datasetPath,
      use_synthetic: body.use_synthetic || !datasetPath,
    });

    // Deactivate all previous models for this user
    await db.update(modelRuns).set({ is_active: false }).where(eq(modelRuns.user_id, req.user!.sub));

    const [run] = await db
      .insert(modelRuns)
      .values({
        user_id: req.user!.sub,
        dataset_id: datasetId ?? null,
        mae: mlResult.mae as number,
        rmse: mlResult.rmse as number,
        r2: mlResult.r2 as number,
        cv_r2_mean: mlResult.cv_r2_mean as number,
        cv_r2_std: mlResult.cv_r2_std as number,
        n_train: mlResult.n_train as number,
        n_test: mlResult.n_test as number,
        feature_importance: mlResult.feature_importance as Record<string, number>,
        model_version: mlResult.model_version as string,
        is_active: true,
      })
      .returning();

    res.status(201).json({ model_run: run, training_metrics: mlResult });
  } catch (err) {
    next(err);
  }
});

// Promote a specific (previously trained) model run to active
router.post('/promote', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { model_run_id } = promoteSchema.parse(req.body);

    const [run] = await db
      .select()
      .from(modelRuns)
      .where(eq(modelRuns.id, model_run_id))
      .limit(1);

    if (!run || run.user_id !== req.user!.sub) {
      res.status(404).json({ error: 'Model run not found' });
      return;
    }

    await db.update(modelRuns).set({ is_active: false }).where(eq(modelRuns.user_id, req.user!.sub));
    await db.update(modelRuns).set({ is_active: true }).where(eq(modelRuns.id, model_run_id));

    res.json({ ok: true, active_model_run_id: model_run_id });
  } catch (err) {
    next(err);
  }
});

router.get('/runs', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await db
      .select()
      .from(modelRuns)
      .where(eq(modelRuns.user_id, req.user!.sub))
      .orderBy(modelRuns.trained_at);

    res.json({ runs });
  } catch (err) {
    next(err);
  }
});

router.get('/feature-importance', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const fi = await mlFeatureImportance();
    res.json({ feature_importance: fi });
  } catch (err) {
    next(err);
  }
});

export default router;
