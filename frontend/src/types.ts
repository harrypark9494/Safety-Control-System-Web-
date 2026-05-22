export type UserRole = "worker" | "admin";

export type WorkType = "직접 고용" | "외부 고용";

export type PayrollDocumentStatus =
  | "missing"
  | "submitted"
  | "reviewing"
  | "approved"
  | "rejected";

export type WorkerRegistrationStatus = "pending" | "approved" | "rejected";

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
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
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
