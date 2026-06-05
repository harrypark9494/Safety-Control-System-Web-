import type { MealType, QrEntitlement, QrUsageSummary } from "../types";
import { requestJson } from "./client";

export async function getWorkerQrEntitlements(workerId: string): Promise<QrEntitlement[]> {
  return requestJson<QrEntitlement[]>(`/api/worker/qr-entitlements/today?workerId=${encodeURIComponent(workerId)}`);
}

export async function getAdminQrUsageSummary(options: { projectId: string; date?: string; mealType?: MealType | "all" }): Promise<QrUsageSummary> {
  const params = new URLSearchParams();

  if (options.date) {
    params.set("date", options.date);
  }

  if (options.mealType) {
    params.set("mealType", options.mealType);
  }

  const query = params.toString();
  return requestJson<QrUsageSummary>(`/api/admin/projects/${encodeURIComponent(options.projectId)}/qr-usage/summary${query ? `?${query}` : ""}`);
}
