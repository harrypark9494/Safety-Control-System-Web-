import type { AppSession, WorkerRegistrationAccount, WorkerSession, WorkType, WorkTypeSetting } from "../../types";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { createFirebaseApp } from "../firebase/firebaseApp";
import { clearSecureEntryPath } from "../navigation";
import { formatPhone } from "../phone";

const SESSION_KEY = "safetyControlSession";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ADMIN_GOOGLE_DOMAIN = import.meta.env.VITE_ADMIN_GOOGLE_DOMAIN ?? "";

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

type AdminLoginResponse = AppSession & {
  role: "admin";
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
    if (contentType.includes("application/json")) {
      const error = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(error?.message || "요청 처리에 실패했습니다.");
    }

    const text = await response.text();
    throw new Error(text || `요청 처리에 실패했습니다. (${response.status})`);
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
  clearSecureEntryPath();
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

export async function getWorkTypes(options: { includeDisabled?: boolean } = {}): Promise<WorkTypeSetting[]> {
  const path = options.includeDisabled ? "/api/admin/work-types" : "/api/work-types";
  return requestJson<WorkTypeSetting[]>(path);
}

export async function saveWorkType(setting: Pick<WorkTypeSetting, "label" | "enabled" | "payrollDocumentsRequired" | "sortOrder">): Promise<WorkTypeSetting> {
  return requestJson<WorkTypeSetting>("/api/admin/work-types", {
    method: "POST",
    body: JSON.stringify(setting),
  });
}

export async function renameWorkType(currentLabel: string, nextLabel: string): Promise<WorkTypeSetting> {
  return requestJson<WorkTypeSetting>("/api/admin/work-types/rename", {
    method: "POST",
    body: JSON.stringify({ currentLabel, nextLabel }),
  });
}

export async function deleteWorkType(label: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/work-types/${encodeURIComponent(label)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const error = await response.json().catch(() => null) as { message?: string } | null;
      throw new Error(error?.message || "고용 유형 삭제에 실패했습니다.");
    }

    const text = await response.text();
    throw new Error(text || "고용 유형 삭제에 실패했습니다.");
  }
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

export async function signInAdmin(): Promise<AppSession> {
  const firebaseApp = createFirebaseApp();

  if (!firebaseApp) {
    throw new Error("Firebase Google 로그인 설정이 필요합니다.");
  }

  const provider = new GoogleAuthProvider();
  if (ADMIN_GOOGLE_DOMAIN) {
    provider.setCustomParameters({ hd: ADMIN_GOOGLE_DOMAIN });
  }

  const auth = getAuth(firebaseApp);
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  const session = await requestJson<AdminLoginResponse>("/api/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  saveSession(session);
  return session;
}

export function requiresPayrollDocuments(session: AppSession | null): boolean {
  return (
    session?.role === "worker" &&
    session.payrollDocumentsRequired &&
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
