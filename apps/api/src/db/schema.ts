import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const gradeEnum = pgEnum('grade', ['A', 'B', 'C', 'D', 'F']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password_hash: text('password_hash').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('user'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('users_email_idx').on(t.email)]
);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token_hash: text('token_hash').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const datasets = pgTable('datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: varchar('filename', { length: 500 }).notNull(),
  row_count: integer('row_count').notNull(),
  column_count: integer('column_count').notNull(),
  storage_path: text('storage_path').notNull(),
  uploaded_at: timestamp('uploaded_at').notNull().defaultNow(),
});

export const modelRuns = pgTable('model_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dataset_id: uuid('dataset_id').references(() => datasets.id, { onDelete: 'set null' }),
  mae: real('mae').notNull(),
  rmse: real('rmse').notNull(),
  r2: real('r2').notNull(),
  cv_r2_mean: real('cv_r2_mean').notNull(),
  cv_r2_std: real('cv_r2_std').notNull(),
  n_train: integer('n_train').notNull(),
  n_test: integer('n_test').notNull(),
  feature_importance: jsonb('feature_importance').$type<Record<string, number>>().notNull(),
  model_version: text('model_version').notNull(),
  is_active: boolean('is_active').notNull().default(false),
  trained_at: timestamp('trained_at').notNull().defaultNow(),
});

export const predictions = pgTable(
  'predictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    model_run_id: uuid('model_run_id').references(() => modelRuns.id, { onDelete: 'set null' }),
    attendance_percent: real('attendance_percent').notNull(),
    study_hours_per_day: real('study_hours_per_day').notNull(),
    previous_score: real('previous_score').notNull(),
    sleep_hours: real('sleep_hours').notNull(),
    predicted_score: real('predicted_score').notNull(),
    grade: gradeEnum('grade').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('predictions_user_id_idx').on(t.user_id),
    index('predictions_created_at_idx').on(t.created_at),
    index('predictions_user_created_idx').on(t.user_id, t.created_at),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  datasets: many(datasets),
  modelRuns: many(modelRuns),
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, { fields: [predictions.user_id], references: [users.id] }),
  modelRun: one(modelRuns, { fields: [predictions.model_run_id], references: [modelRuns.id] }),
}));

export const modelRunsRelations = relations(modelRuns, ({ one, many }) => ({
  user: one(users, { fields: [modelRuns.user_id], references: [users.id] }),
  dataset: one(datasets, { fields: [modelRuns.dataset_id], references: [datasets.id] }),
  predictions: many(predictions),
}));

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  user: one(users, { fields: [datasets.user_id], references: [users.id] }),
  modelRuns: many(modelRuns),
}));
