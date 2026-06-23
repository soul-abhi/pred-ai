import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../db/client';
import { datasets } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
    } else {
      cb(null, true);
    }
  },
});

function parseCsvPreview(filePath: string, previewRows = 5): { columns: string[]; rows: Record<string, string>[]; rowCount: number } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return { columns: [], rows: [], rowCount: 0 };

  const columns = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1, previewRows + 1).map((line) => {
    const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(columns.map((col, i) => [col, vals[i] ?? '']));
  });

  return { columns, rows, rowCount: lines.length - 1 };
}

router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { columns, rows, rowCount } = parseCsvPreview(req.file.path);

    const [dataset] = await db
      .insert(datasets)
      .values({
        user_id: req.user!.sub,
        filename: req.file.originalname,
        row_count: rowCount,
        column_count: columns.length,
        storage_path: req.file.path,
      })
      .returning();

    res.status(201).json({
      dataset: {
        id: dataset.id,
        filename: dataset.filename,
        row_count: dataset.row_count,
        column_count: dataset.column_count,
        uploaded_at: dataset.uploaded_at,
      },
      columns,
      rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db
      .select({
        id: datasets.id,
        filename: datasets.filename,
        row_count: datasets.row_count,
        column_count: datasets.column_count,
        uploaded_at: datasets.uploaded_at,
      })
      .from(datasets)
      .where(eq(datasets.user_id, req.user!.sub))
      .orderBy(datasets.uploaded_at);

    res.json({ datasets: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
