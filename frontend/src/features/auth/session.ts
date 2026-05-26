import type {
  AppSession,
  AdminWeatherOverview,
  MealType,
  QrEntitlement,
  QrUsageSummary,
  WeatherThresholds,
  WorkerRegistrationAccount,
  WorkerSession,
  WorkType,
  WorkTypeSetting,
} from "../../types";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { createFirebaseApp } from "../firebase/firebaseApp";
import { clearSecureEntryPath } from "../navigation";
import { formatPhone } from "../phone";

const SESSION_KEY = "safetyControlSession";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ADMIN_GOOGLE_DOMAIN = import.meta.env.VITE_ADMIN_GOOGLE_DOMAIN ?? "";
const ENABLE_LOCAL_ADMIN_BYPASS = import.meta.env.VITE_ENABLE_LOCAL_ADMIN_BYPASS === "true";

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

async function readApiError(response: Response, fallbackMessage: string): Promise<Error> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const error = await response.json().catch(() => null) as { message?: string } | null;
    return new Error(error?.message || fallbackMessage);
  }

  const text = await response.text();
  return new Error(text || fallbackMessage);
}

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
    throw await readApiError(response, `요청 처리에 실패했습니다. (${response.status})`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("API 서버 응답이 JSON이 아닙니다. 백엔드 서버 또는 API 배포 연결을 확인해 주세요.");
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw await readApiError(response, "요청 처리에 실패했습니다.");
  }
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
  await requestNoContent(`/api/admin/work-types/${encodeURIComponent(label)}`, {
    method: "DELETE",
  });
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
  await requestNoContent(`/api/admin/worker-registrations/${encodeURIComponent(formatPhone(phone))}`, {
    method: "DELETE",
  });
}

export async function getWorkerQrEntitlements(workerId: string): Promise<QrEntitlement[]> {
  return requestJson<QrEntitlement[]>(`/api/worker/qr-entitlements/today?workerId=${encodeURIComponent(workerId)}`);
}

export async function getAdminQrUsageSummary(options: { date?: string; mealType?: MealType | "all" } = {}): Promise<QrUsageSummary> {
  const params = new URLSearchParams();

  if (options.date) {
    params.set("date", options.date);
  }

  if (options.mealType) {
    params.set("mealType", options.mealType);
  }

  const query = params.toString();
  return requestJson<QrUsageSummary>(`/api/admin/qr-usage/summary${query ? `?${query}` : ""}`);
}

export async function getAdminWeatherOverview(): Promise<AdminWeatherOverview> {
  return requestJson<AdminWeatherOverview>("/api/admin/weather");
}

export async function updateAdminWeatherStation(station: { name?: string; latitude: number; longitude: number }): Promise<AdminWeatherOverview> {
  return requestJson<AdminWeatherOverview>("/api/admin/weather/station", {
    method: "POST",
    body: JSON.stringify(station),
  });
}

export async function updateAdminWeatherThresholds(thresholds: WeatherThresholds): Promise<AdminWeatherOverview> {
  return requestJson<AdminWeatherOverview>("/api/admin/weather/thresholds", {
    method: "POST",
    body: JSON.stringify(thresholds),
  });
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
  if (ENABLE_LOCAL_ADMIN_BYPASS && import.meta.env.DEV) {
    const session: AppSession = {
      uid: "local-admin",
      role: "admin",
      name: "로컬 관리자",
      email: "local-admin@example.test",
    };

    saveSession(session);
    return session;
  }

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
