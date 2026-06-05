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
  return requestJson<WorkerCategorySetting[]>(`/api/projects/${encodeURIComponent(projectId)}/worker-categories`);
}

export async function getAdminWorkerCategories(projectId: string): Promise<WorkerCategorySetting[]> {
  return requestJson<WorkerCategorySetting[]>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-categories`);
}

export async function getAdminScheduleColumns(projectId: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>(`/api/admin/projects/${encodeURIComponent(projectId)}/schedule-columns`);
}

export async function createAdminScheduleColumn(projectId: string, label: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>(`/api/admin/projects/${encodeURIComponent(projectId)}/schedule-columns`, {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function deleteAdminScheduleColumn(id: string, projectId: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>(`/api/admin/projects/${encodeURIComponent(projectId)}/schedule-columns/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function saveWorkerCategory(projectId: string, setting: Pick<WorkerCategorySetting, "category" | "enabled" | "signupEnabled" | "payrollDocumentsRequired" | "sortOrder">): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-categories`, {
    method: "POST",
    body: JSON.stringify(setting),
  });
}

export async function renameWorkerCategory(projectId: string, currentCategory: string, nextCategory: string): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-categories/rename`, {
    method: "POST",
    body: JSON.stringify({ currentCategory, nextCategory }),
  });
}

export async function deleteWorkerCategory(projectId: string, category: string): Promise<void> {
  await requestNoContent(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-categories/${encodeURIComponent(category)}`, {
    method: "DELETE",
  });
}

export async function getRegisteredWorkers(projectId: string): Promise<WorkerRegistrationAccount[]> {
  const workers = await requestJson<WorkerRegistrationResponse[]>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-registrations`);
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
  const worker = await requestJson<WorkerRegistrationResponse>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-registrations`, {
    method: "POST",
    body: JSON.stringify({ name, phone: formatPhone(phone), category, company, team, memo }),
  });

  return toRegistrationAccount(worker);
}

export async function updateRegisteredWorker(
  projectId: string,
  uid: string,
  patch: Partial<Pick<WorkerRegistrationAccount, "projectId" | "name" | "phone" | "category" | "company" | "team" | "memo">>,
): Promise<WorkerRegistrationAccount> {
  const bodyPatch = { ...patch, phone: patch.phone ? formatPhone(patch.phone) : undefined };
  delete bodyPatch.projectId;
  const worker = await requestJson<WorkerRegistrationResponse>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-registrations/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify(bodyPatch),
  });

  return toRegistrationAccount(worker);
}

export async function deleteRegisteredWorker(projectId: string, uid: string): Promise<void> {
  await requestNoContent(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-registrations/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
}

export async function importRegisteredWorkersXlsx(projectId: string, file: File): Promise<WorkerImportResult> {
  const form = new FormData();
  form.append("file", file);
  const result = await requestJson<WorkerImportResult>(`/api/admin/projects/${encodeURIComponent(projectId)}/worker-registrations/import-xlsx`, {
    method: "POST",
    body: form,
  });

  return {
    ...result,
    workers: result.workers.map(toRegistrationAccount),
  };
}
