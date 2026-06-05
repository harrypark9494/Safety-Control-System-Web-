import type { AppSession, WorkerCategory, WorkerRegistrationAccount, WorkerSession } from "../types";
import { formatPhone } from "../features/phone";
import { requestJson } from "./client";
import { toRegistrationAccount, type WorkerRegistrationResponse } from "./workersApi";

export type WorkerLoginResponse = WorkerSession & {
  payrollDocumentsRequired: boolean;
};

export type AdminLoginResponse = AppSession & {
  role: "admin";
};

export async function completeWorkerOnboarding(
  projectId: string,
  name: string,
  phone: string,
  code: string,
  password: string,
  category: WorkerCategory,
): Promise<WorkerRegistrationAccount> {
  const worker = await requestJson<WorkerRegistrationResponse>("/api/worker-registrations", {
    method: "POST",
    body: JSON.stringify({ projectId, name, phone: formatPhone(phone), code, password, category }),
  });

  return toRegistrationAccount(worker);
}

export async function requestWorkerLogin(
  projectId: string,
  phone: string,
  code: string,
  password: string,
  name: string,
): Promise<WorkerLoginResponse> {
  return requestJson<WorkerLoginResponse>("/api/auth/worker-login", {
    method: "POST",
    body: JSON.stringify({ projectId, name, phone: formatPhone(phone), code, password }),
  });
}

export async function requestAdminLogin(idToken: string): Promise<AdminLoginResponse> {
  return requestJson<AdminLoginResponse>("/api/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}
