import type { AppSession, WorkerRegistrationAccount, WorkerSession, WorkType } from "../../types";
import { formatPhone } from "../phone";

const SESSION_KEY = "safetyControlSession";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type WorkerRegistrationResponse = {
  uid: string;
  name: string;
  phone: string;
  workType: WorkType;
  team: string;
  supervisor: string;
  registrationStatus: WorkerRegistrationAccount["registrationStatus"];
  payrollDocumentStatus: WorkerSession["payrollDocumentStatus"];
  registeredAt: string;
  onboardedAt?: string;
};

type WorkerLoginResponse = WorkerSession & {
  payrollDocumentsRequired: boolean;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "요청 처리에 실패했습니다.");
  }

  if (!contentType.includes("application/json")) {
    throw new Error("API 서버 응답이 JSON이 아닙니다. 백엔드 서버 또는 API 배포 연결을 확인해 주세요.");
  }

  return response.json() as Promise<T>;
}

function toRegistrationAccount(worker: WorkerRegistrationResponse): WorkerRegistrationAccount {
  return {
    uid: worker.uid,
    name: worker.name,
    phone: worker.phone,
    workType: worker.workType,
    team: worker.team,
    supervisor: worker.supervisor,
    registrationStatus: worker.registrationStatus,
    payrollDocumentStatus: worker.payrollDocumentStatus,
    registeredAt: worker.registeredAt,
    onboardedAt: worker.onboardedAt,
  };
}

export function getSession(): AppSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AppSession): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}

export async function completeWorkerOnboarding(
  name: string,
  phone: string,
  code: string,
  password: string,
  workType: WorkType,
): Promise<WorkerRegistrationAccount> {
  const worker = await requestJson<WorkerRegistrationResponse>("/api/worker-registrations", {
    method: "POST",
    body: JSON.stringify({ name, phone: formatPhone(phone), code, password, workType }),
  });

  return toRegistrationAccount(worker);
}

export async function getRegisteredWorkers(): Promise<WorkerRegistrationAccount[]> {
  const workers = await requestJson<WorkerRegistrationResponse[]>("/api/admin/worker-registrations");
  return workers.map(toRegistrationAccount);
}

export async function createRegisteredWorker(
  name: string,
  phone: string,
  workType: WorkType,
  team: string,
  supervisor: string,
): Promise<WorkerRegistrationAccount> {
  const worker = await requestJson<WorkerRegistrationResponse>("/api/admin/worker-registrations", {
    method: "POST",
    body: JSON.stringify({ name, phone: formatPhone(phone), workType, team, supervisor }),
  });

  return toRegistrationAccount(worker);
}

export async function deleteRegisteredWorker(phone: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/worker-registrations/${encodeURIComponent(formatPhone(phone))}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "근로자 삭제에 실패했습니다.");
  }
}

export async function signInWorker(
  phone: string,
  code: string,
  password: string,
  name: string,
): Promise<WorkerSession> {
  const session = await requestJson<WorkerLoginResponse>("/api/auth/worker-login", {
    method: "POST",
    body: JSON.stringify({ name, phone: formatPhone(phone), code, password }),
  });

  saveSession(session);
  return session;
}

export function signInAdmin(): AppSession {
  const session: AppSession = {
    uid: "admin-local-session",
    role: "admin",
    name: "관리자",
    email: "admin@safetycontrol.local",
  };

  saveSession(session);
  return session;
}

export function requiresPayrollDocuments(session: AppSession | null): boolean {
  return (
    session?.role === "worker" &&
    session.workType === "직접 고용" &&
    session.payrollDocumentStatus === "missing"
  );
}

export function markPayrollSubmitted(): void {
  const session = getSession();

  if (session?.role !== "worker") {
    return;
  }

  saveSession({ ...session, payrollDocumentStatus: "submitted" });
}
