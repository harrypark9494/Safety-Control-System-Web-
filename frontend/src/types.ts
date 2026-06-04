export type UserRole = "worker" | "admin";
export type AdminAccess = "workspace" | "schedule" | "qr";
export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type WorkerCategory = string;

export type PayrollDocumentStatus =
  | "missing"
  | "submitted"
  | "reviewing"
  | "approved"
  | "rejected";

export type WorkerRegistrationStatus = "registered" | "onboarded";

export interface WorkerSession {
  uid: string;
  projectId: string;
  role: "worker";
  name: string;
  phone: string;
  category: WorkerCategory;
  company: string;
  workerTeam: string;
  schedule: string;
  status: string;
  payrollDocumentsRequired: boolean;
  payrollDocumentStatus: PayrollDocumentStatus;
}

export interface AdminSession {
  uid: string;
  role: "admin";
  name: string;
  email: string;
  adminAccess: AdminAccess;
}

export type AppSession = WorkerSession | AdminSession;

export interface WorkerQrUsageSummary {
  meal: QrUsageMetric;
  water: QrUsageMetric;
}

export interface WorkerRegistrationAccount {
  uid: string;
  projectId: string;
  name: string;
  phone: string;
  category: WorkerCategory;
  company: string;
  team: string;
  memo: string;
  registrationStatus: WorkerRegistrationStatus;
  payrollDocumentStatus: PayrollDocumentStatus;
  registeredAt: string;
  onboardedAt?: string;
  qrUsage?: WorkerQrUsageSummary;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  eventStartDate?: string;
  eventEndDate?: string | null;
  location: string;
  description: string;
  createdBy: string;
  createdAt: string;
  archivedAt: string | null;
}

export interface WorkerCategorySetting {
  projectId: string;
  category: WorkerCategory;
  enabled: boolean;
  signupEnabled: boolean;
  payrollDocumentsRequired: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface WorkerImportError {
  row: number;
  column: "C" | "D" | "E" | "F" | "H" | "I";
  label: string;
  code: string;
  message: string;
}

export interface WorkerImportResult {
  importedCount: number;
  rejectedCount: number;
  errors: WorkerImportError[];
  workers: WorkerRegistrationAccount[];
}

export interface AdminScheduleColumn {
  id?: string;
  label: string;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollSubmission {
  category: WorkerCategory;
  residentNumber: string;
  postcode: string;
  address: string;
  addressDetail: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  submittedAt: string;
}

export type QrType = "meal" | "water";
export type MealType = "lunch" | "dinner";

export interface QrEntitlement {
  qrType: QrType;
  label: string;
  issuedDate: string;
  totalCount: number;
  usedCount: number;
  remainingCount: number;
  status: "active" | "exhausted" | "revoked";
  qrToken: string;
  help: string;
}

export interface QrUsageMetric {
  issued: number;
  used: number;
  remaining: number;
  usageRate: number;
}

export interface QrHourlyUsage {
  hourRange: string;
  mealUsed: number;
  waterUsed: number;
  status: string;
}

export interface QrUsageSummary {
  date: string;
  mealType: MealType | "all";
  totals: {
    meal: QrUsageMetric;
    water: QrUsageMetric;
  };
  hourlyUsage: QrHourlyUsage[];
}

export type WeatherRiskLevel = "normal" | "caution" | "alert" | "danger";
export type WeatherMetricKey = "windSpeed" | "precipitation" | "temperature" | "humidity";
export type WeatherMetricTone = "green" | "orange" | "red";

export interface WeatherMetric {
  key: WeatherMetricKey;
  label: string;
  sourceLabel: string;
  value: number;
  unit: string;
  thresholdLabel: string;
  percent: number;
  status: "NORMAL" | "CAUTION" | "ALERT";
  tone: WeatherMetricTone;
}

export interface WeatherForecastItem {
  time: string;
  icon: string;
  condition: string;
  rainProbability: number;
  precipitation: number;
  temperature: number;
  windSpeed: number;
  riskLevel: WeatherRiskLevel;
}

export interface WeatherAlertLog {
  id: string;
  level: Exclude<WeatherRiskLevel, "normal">;
  title: string;
  time: string;
  message: string;
}

export interface WeatherStation {
  name: string;
  latitude: number;
  longitude: number;
  nx: number;
  ny: number;
  source: "KMA";
  updatedAt: string;
}

export interface WeatherThresholds {
  windSpeed: number;
  precipitation: number;
  temperature: number;
  humidity: number;
}

export interface WeatherCorrectionProfile {
  temperatureOffset: number;
  windSpeedOffset: number;
  humidityOffset: number;
  precipitationOffset: number;
}

export interface AdminWeatherOverview {
  source: {
    provider: "KMA";
    name: string;
    mode: "adapter-placeholder" | "live" | "test-fixture";
    baseDateTime: string;
    updatedAt: string;
    advisoryMergePolicy: string;
  };
  site: WeatherStation;
  thresholds: WeatherThresholds;
  correctionProfile: WeatherCorrectionProfile;
  current: {
    condition: string;
    riskLevel: WeatherRiskLevel;
    summary: string;
    metrics: WeatherMetric[];
  };
  forecast24h: WeatherForecastItem[];
  alertLogs: WeatherAlertLog[];
}
