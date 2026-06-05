import type {
  AdminScheduleColumn,
  WorkerCategorySetting,
  WorkerImportResult,
  WorkerRegistrationAccount,
  WorkerSession,
} from "../types";
import { formatPhone } from "../features/phone";
import { requestJson, requestNoContent } from "./client";

export type WorkerRegistrationResponse = {
  uid: string;
  projectId: string;
  name: string;
  phone: string;
  category: WorkerRegistrationAccount["category"];
  company: string;
  team: string;
  memo: string;
  registrationStatus: WorkerRegistrationAccount["registrationStatus"];
  payrollDocumentStatus: WorkerSession["payrollDocumentStatus"];
  registeredAt: string;
  onboardedAt?: string;
  qrUsage?: WorkerRegistrationAccount["qrUsage"];
};

export function toRegistrationAccount(worker: WorkerRegistrationResponse): WorkerRegistrationAccount {
  return {
    uid: worker.uid,
    projectId: worker.projectId,
    name: worker.name,
    phone: worker.phone,
    category: worker.category,
    company: worker.company,
    team: worker.team,
    memo: worker.memo,
    registrationStatus: worker.registrationStatus,
    payrollDocumentStatus: worker.payrollDocumentStatus,
    registeredAt: worker.registeredAt,
    onboardedAt: worker.onboardedAt,
    qrUsage: worker.qrUsage,
  };
}

export async function getWorkerCategories(projectId: string): Promise<WorkerCategorySetting[]> {
  return requestJson<WorkerCategorySetting[]>(`/api/worker-categories?projectId=${encodeURIComponent(projectId)}`);
}

export async function getAdminWorkerCategories(projectId: string): Promise<WorkerCategorySetting[]> {
  return requestJson<WorkerCategorySetting[]>(`/api/admin/worker-categories?projectId=${encodeURIComponent(projectId)}`);
}

export async function getAdminScheduleColumns(projectId: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>(`/api/admin/schedule-columns?projectId=${encodeURIComponent(projectId)}`);
}

export async function createAdminScheduleColumn(projectId: string, label: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>("/api/admin/schedule-columns", {
    method: "POST",
    body: JSON.stringify({ projectId, label }),
  });
}

export async function deleteAdminScheduleColumn(id: string, projectId: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>(`/api/admin/schedule-columns/${encodeURIComponent(id)}?projectId=${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
}

export async function saveWorkerCategory(projectId: string, setting: Pick<WorkerCategorySetting, "category" | "enabled" | "signupEnabled" | "payrollDocumentsRequired" | "sortOrder">): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>("/api/admin/worker-categories", {
    method: "POST",
    body: JSON.stringify({ ...setting, projectId }),
  });
}

export async function renameWorkerCategory(projectId: string, currentCategory: string, nextCategory: string): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>("/api/admin/worker-categories/rename", {
    method: "POST",
    body: JSON.stringify({ projectId, currentCategory, nextCategory }),
  });
}

export async function deleteWorkerCategory(projectId: string, category: string): Promise<void> {
  await requestNoContent(`/api/admin/worker-categories/${encodeURIComponent(category)}?projectId=${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
}

export async function getRegisteredWorkers(projectId: string): Promise<WorkerRegistrationAccount[]> {
  const workers = await requestJson<WorkerRegistrationResponse[]>(`/api/admin/worker-registrations?projectId=${encodeURIComponent(projectId)}`);
  return workers.map(toRegistrationAccount);
}

export async function createRegisteredWorker(
  projectId: string,
  name: string,
  phone: string,
  category: WorkerRegistrationAccount["category"],
  company: string,
  team: string,
  memo: string,
): Promise<WorkerRegistrationAccount> {
  const worker = await requestJson<WorkerRegistrationResponse>("/api/admin/worker-registrations", {
    method: "POST",
    body: JSON.stringify({ projectId, name, phone: formatPhone(phone), category, company, team, memo }),
  });

  return toRegistrationAccount(worker);
}

export async function updateRegisteredWorker(
  uid: string,
  patch: Partial<Pick<WorkerRegistrationAccount, "projectId" | "name" | "phone" | "category" | "company" | "team" | "memo">>,
): Promise<WorkerRegistrationAccount> {
  const worker = await requestJson<WorkerRegistrationResponse>(`/api/admin/worker-registrations/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, phone: patch.phone ? formatPhone(patch.phone) : undefined }),
  });

  return toRegistrationAccount(worker);
}

export async function deleteRegisteredWorker(uid: string): Promise<void> {
  await requestNoContent(`/api/admin/worker-registrations/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
}

export async function importRegisteredWorkersXlsx(projectId: string, file: File): Promise<WorkerImportResult> {
  const form = new FormData();
  form.append("file", file);
  const params = new URLSearchParams({ projectId });
  const result = await requestJson<WorkerImportResult>(`/api/admin/worker-registrations/import-xlsx?${params}`, {
    method: "POST",
    body: form,
  });

  return {
    ...result,
    workers: result.workers.map(toRegistrationAccount),
  };
}
