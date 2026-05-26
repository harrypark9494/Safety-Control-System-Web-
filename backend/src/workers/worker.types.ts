export type RegistrationStatus = 'registered' | 'onboarded';
export type PayrollDocumentStatus = 'missing' | 'submitted' | 'reviewing' | 'approved' | 'rejected';

export interface WorkerRegistration {
  uid: string;
  name: string;
  phone: string;
  passwordHash: string | null;
  verificationCode: string | null;
  workType: string;
  team: string;
  supervisor: string;
  registrationStatus: RegistrationStatus;
  payrollDocumentStatus: PayrollDocumentStatus;
  registeredAt: string;
  onboardedAt: string | null;
}

export interface WorkTypeSetting {
  label: string;
  enabled: boolean;
  payrollDocumentsRequired: boolean;
  sortOrder: number;
  updatedAt: string;
}
