export type QrType = 'meal' | 'water';
export type MealType = 'lunch' | 'dinner';
export type QrEntitlementStatus = 'active' | 'exhausted' | 'revoked';

export interface QrEntitlement {
  id: string;
  projectId: string;
  workerId: string;
  qrType: QrType;
  issuedDate: string;
  totalCount: number;
  usedCount: number;
  status: QrEntitlementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QrUsageEvent {
  id: string;
  entitlementId: string;
  projectId: string;
  workerId: string;
  qrType: QrType;
  usedAt: string;
  scanLocation: string;
  mealType: MealType | null;
}
