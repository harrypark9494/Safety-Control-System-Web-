export type RegistrationStatus = 'registered' | 'onboarded';
export type PayrollDocumentStatus = 'missing' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
export type WorkerImportColumn = 'C' | 'D' | 'E' | 'F' | 'H' | 'I';

export interface WorkerQrUsageMetric {
  issued: number;
  used: number;
  remaining: number;
  usageRate: number;
}

export interface WorkerQrUsageSummary {
  meal: WorkerQrUsageMetric;
  water: WorkerQrUsageMetric;
}

export interface WorkerRegistration {
  uid: string;
  projectId: string;
  name: string;
  phone: string;
  passwordHash: string | null;
  verificationCode: string | null;
  category: string;
  company: string;
  role: string;
  memo: string;
  registrationStatus: RegistrationStatus;
  payrollDocumentStatus: PayrollDocumentStatus;
  registeredAt: string;
  onboardedAt: string | null;
  qrUsage?: WorkerQrUsageSummary;
}

export interface WorkerCategorySetting {
  category: string;
  enabled: boolean;
  signupEnabled: boolean;
  payrollDocumentsRequired: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface WorkerImportError {
  row: number;
  column: WorkerImportColumn;
  label: string;
  code: string;
  message: string;
}

export interface WorkerImportResult {
  importedCount: number;
  rejectedCount: number;
  errors: WorkerImportError[];
  workers: Omit<WorkerRegistration, 'passwordHash' | 'verificationCode'>[];
}

export interface ScheduleColumn {
  id: string;
  label: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
