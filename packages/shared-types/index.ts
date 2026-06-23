// Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthResponse {
  user: User;
}

export interface SignupBody {
  email: string;
  password: string;
  name: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

// Prediction
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PredictInput {
  attendance_percent: number;
  study_hours_per_day: number;
  previous_score: number;
  sleep_hours: number;
}

export interface PredictResult {
  predicted_score: number;
  grade: Grade;
  model_version: string;
}

export interface PredictionRecord {
  id: string;
  attendance_percent: number;
  study_hours_per_day: number;
  previous_score: number;
  sleep_hours: number;
  predicted_score: number;
  grade: Grade;
  model_version: string;
  created_at: string;
}

// Model metrics
export interface ModelMetrics {
  id: string;
  mae: number;
  rmse: number;
  r2: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  n_train: number;
  n_test: number;
  feature_importance: Record<string, number>;
  is_active: boolean;
  trained_at: string;
  dataset_id: string | null;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

// Dataset
export interface Dataset {
  id: string;
  filename: string;
  row_count: number;
  column_count: number;
  uploaded_at: string;
}

export interface DatasetPreview {
  dataset: Dataset;
  columns: string[];
  rows: Record<string, unknown>[];
}

// Reports
export interface ReportsQuery {
  page?: number;
  per_page?: number;
  grade?: Grade;
  date_from?: string;
  date_to?: string;
  sort?: 'created_at' | 'predicted_score';
  order?: 'asc' | 'desc';
}

export interface PaginatedPredictions {
  data: PredictionRecord[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// API envelope
export interface ApiError {
  error: string;
  code?: string;
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  db: boolean;
  ml_service: boolean;
  model_loaded: boolean;
  model_version: string | null;
}
