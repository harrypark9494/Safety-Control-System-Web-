export type UserRole = "worker" | "admin";

export type WorkType = string;

export type PayrollDocumentStatus =
  | "missing"
  | "submitted"
  | "reviewing"
  | "approved"
  | "rejected";

export type WorkerRegistrationStatus = "registered" | "onboarded";

export interface WorkerSession {
  uid: string;
  role: "worker";
  name: string;
  phone: string;
  workType: WorkType;
  team: string;
  supervisor: string;
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
}

export type AppSession = WorkerSession | AdminSession;

export interface WorkerRegistrationAccount {
  uid: string;
  name: string;
  phone: string;
  workType: WorkType;
  team: string;
  supervisor: string;
  registrationStatus: WorkerRegistrationStatus;
  payrollDocumentStatus: PayrollDocumentStatus;
  registeredAt: string;
  onboardedAt?: string;
}

export interface WorkTypeSetting {
  label: WorkType;
  enabled: boolean;
  payrollDocumentsRequired: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface PayrollSubmission {
  workType: WorkType;
  residentNumber: string;
  postcode: string;
  address: string;
  addressDetail: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  submittedAt: string;
}
