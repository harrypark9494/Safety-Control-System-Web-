import type {
  AppSession,
  AdminAccess,
  AdminScheduleColumn,
  AdminWeatherOverview,
  MealType,
  Project,
  ProjectStatus,
  QrEntitlement,
  QrUsageSummary,
  WeatherThresholds,
  WorkerRegistrationAccount,
  WorkerSession,
  WorkerCategory,
  WorkerCategorySetting,
  WorkerImportResult,
} from "../../types";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { clearSecureEntryPath } from "../navigation";
import { formatPhone } from "../phone";
import { buildTestWeatherOverview } from "../weather/testWeatherFixture";
import { normalizeAdminAccess } from "./adminAccess";

const SESSION_KEY = "safetyControlSession";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ADMIN_GOOGLE_DOMAIN = import.meta.env.VITE_ADMIN_GOOGLE_DOMAIN ?? "";
const ENABLE_LOCAL_ADMIN_BYPASS = import.meta.env.VITE_ENABLE_LOCAL_ADMIN_BYPASS === "true";
const ENABLE_TEST_WEATHER_MOCK = import.meta.env.VITE_ENABLE_TEST_WEATHER_MOCK === "true";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

type WorkerRegistrationResponse = {
  uid: string;
  projectId: string;
  name: string;
  phone: string;
  category: WorkerCategory;
  company: string;
  team: string;
  memo: string;
  registrationStatus: WorkerRegistrationAccount["registrationStatus"];
  payrollDocumentStatus: WorkerSession["payrollDocumentStatus"];
  registeredAt: string;
  onboardedAt?: string;
  qrUsage?: WorkerRegistrationAccount["qrUsage"];
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

async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await readApiError(response, `요청 처리에 실패했습니다. (${response.status})`);
  }

  return response;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApi(path, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("API 서버 응답이 JSON이 아닙니다. 백엔드 서버 또는 API 배포 연결을 확인해 주세요.");
  }

  return response.json() as Promise<T>;
}

async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  await requestApi(path, init);
}

function toRegistrationAccount(worker: WorkerRegistrationResponse): WorkerRegistrationAccount {
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

function createFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  const [existingApp] = getApps();
  if (existingApp) {
    return existingApp;
  }

  return initializeApp(firebaseConfig);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string" && value[key].trim().length > 0;
}

function isPayrollDocumentStatus(value: unknown): value is WorkerSession["payrollDocumentStatus"] {
  return ["missing", "submitted", "reviewing", "approved", "rejected"].includes(String(value));
}

function isWorkerSession(value: unknown): value is WorkerSession {
  return (
    isRecord(value) &&
    value.role === "worker" &&
    hasString(value, "uid") &&
    hasString(value, "name") &&
    hasString(value, "phone") &&
    hasString(value, "category") &&
    hasString(value, "company") &&
    hasString(value, "workerTeam") &&
    hasString(value, "schedule") &&
    hasString(value, "status") &&
    typeof value.payrollDocumentsRequired === "boolean" &&
    isPayrollDocumentStatus(value.payrollDocumentStatus)
  );
}

function normalizeWorkerSession(session: WorkerLoginResponse | WorkerSession): WorkerSession {
  return {
    ...session,
    workerTeam: session.workerTeam,
  };
}

function isAdminSession(value: unknown): value is AppSession {
  return (
    isRecord(value) &&
    value.role === "admin" &&
    hasString(value, "uid") &&
    hasString(value, "name") &&
    hasString(value, "email")
  );
}

function isAppSession(value: unknown): value is AppSession {
  return isWorkerSession(value) || isAdminSession(value);
}

export function getSession(): AppSession | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const session: unknown = JSON.parse(raw);

    if (isAppSession(session)) {
      if (session.role === "admin") {
        return {
          ...session,
          adminAccess: normalizeAdminAccess(session.adminAccess),
        };
      }

      return normalizeWorkerSession(session);
    }

    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AppSession): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session.role === "worker" ? normalizeWorkerSession(session) : session));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
  clearSecureEntryPath();
}

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

export async function getWorkerCategories(): Promise<WorkerCategorySetting[]> {
  return requestJson<WorkerCategorySetting[]>("/api/worker-categories");
}

export async function getAdminWorkerCategories(): Promise<WorkerCategorySetting[]> {
  return requestJson<WorkerCategorySetting[]>("/api/admin/worker-categories");
}

export async function getAdminScheduleColumns(projectId?: string): Promise<AdminScheduleColumn[]> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("projectId", projectId);
  }

  return requestJson<AdminScheduleColumn[]>(`/api/admin/schedule-columns${params.toString() ? `?${params}` : ""}`);
}

export async function createAdminScheduleColumn(projectId: string, label: string): Promise<AdminScheduleColumn[]> {
  return requestJson<AdminScheduleColumn[]>("/api/admin/schedule-columns", {
    method: "POST",
    body: JSON.stringify({ projectId, label }),
  });
}

export async function deleteAdminScheduleColumn(id: string, projectId?: string): Promise<AdminScheduleColumn[]> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("projectId", projectId);
  }

  return requestJson<AdminScheduleColumn[]>(`/api/admin/schedule-columns/${encodeURIComponent(id)}${params.toString() ? `?${params}` : ""}`, {
    method: "DELETE",
  });
}

export async function saveWorkerCategory(setting: Pick<WorkerCategorySetting, "category" | "enabled" | "signupEnabled" | "payrollDocumentsRequired" | "sortOrder">): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>("/api/admin/worker-categories", {
    method: "POST",
    body: JSON.stringify(setting),
  });
}

export async function renameWorkerCategory(currentCategory: string, nextCategory: string): Promise<WorkerCategorySetting> {
  return requestJson<WorkerCategorySetting>("/api/admin/worker-categories/rename", {
    method: "POST",
    body: JSON.stringify({ currentCategory, nextCategory }),
  });
}

export async function deleteWorkerCategory(category: string): Promise<void> {
  await requestNoContent(`/api/admin/worker-categories/${encodeURIComponent(category)}`, {
    method: "DELETE",
  });
}

export async function getAdminProjects(options: { includeArchived?: boolean } = {}): Promise<Project[]> {
  const params = new URLSearchParams();
  if (options.includeArchived) {
    params.set("includeArchived", "true");
  }

  const query = params.toString();
  return requestJson<Project[]>(`/api/admin/projects${query ? `?${query}` : ""}`);
}

export async function getSelectableProjects(): Promise<Project[]> {
  return requestJson<Project[]>("/api/projects");
}

export async function getActiveAdminProject(): Promise<Project | null> {
  return requestJson<Project | null>("/api/admin/projects/active");
}

export async function createAdminProject(project: {
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string | null;
  location: string;
  description?: string;
  createdBy?: string;
}): Promise<Project> {
  return requestJson<Project>("/api/admin/projects", {
    method: "POST",
    body: JSON.stringify(project),
  });
}

export async function updateAdminProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
  return requestJson<Project>(`/api/admin/projects/${encodeURIComponent(projectId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function getRegisteredWorkers(projectId?: string): Promise<WorkerRegistrationAccount[]> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("projectId", projectId);
  }

  const workers = await requestJson<WorkerRegistrationResponse[]>(`/api/admin/worker-registrations${params.toString() ? `?${params}` : ""}`);
  return workers.map(toRegistrationAccount);
}

export async function createRegisteredWorker(
  projectId: string,
  name: string,
  phone: string,
  category: WorkerCategory,
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

export async function getWorkerQrEntitlements(workerId: string): Promise<QrEntitlement[]> {
  return requestJson<QrEntitlement[]>(`/api/worker/qr-entitlements/today?workerId=${encodeURIComponent(workerId)}`);
}

export async function getAdminQrUsageSummary(options: { date?: string; mealType?: MealType | "all"; projectId?: string } = {}): Promise<QrUsageSummary> {
  const params = new URLSearchParams();

  if (options.date) {
    params.set("date", options.date);
  }

  if (options.mealType) {
    params.set("mealType", options.mealType);
  }

  if (options.projectId) {
    params.set("projectId", options.projectId);
  }

  const query = params.toString();
  return requestJson<QrUsageSummary>(`/api/admin/qr-usage/summary${query ? `?${query}` : ""}`);
}

export async function getAdminWeatherOverview(projectId?: string): Promise<AdminWeatherOverview> {
  const params = new URLSearchParams();
  if (projectId) {
    params.set("projectId", projectId);
  }

  try {
    return await requestJson<AdminWeatherOverview>(`/api/admin/weather${params.toString() ? `?${params}` : ""}`);
  } catch (error) {
    if (ENABLE_TEST_WEATHER_MOCK) {
      return buildTestWeatherOverview(projectId);
    }

    throw error;
  }
}

export async function updateAdminWeatherStation(station: { projectId?: string; name?: string; latitude: number; longitude: number }): Promise<AdminWeatherOverview> {
  return requestJson<AdminWeatherOverview>("/api/admin/weather/station", {
    method: "POST",
    body: JSON.stringify(station),
  });
}

export async function updateAdminWeatherThresholds(thresholds: WeatherThresholds & { projectId?: string }): Promise<AdminWeatherOverview> {
  return requestJson<AdminWeatherOverview>("/api/admin/weather/thresholds", {
    method: "POST",
    body: JSON.stringify(thresholds),
  });
}

export async function signInWorker(
  projectId: string,
  phone: string,
  code: string,
  password: string,
  name: string,
): Promise<WorkerSession> {
  const session = await requestJson<WorkerLoginResponse>("/api/auth/worker-login", {
    method: "POST",
    body: JSON.stringify({ projectId, name, phone: formatPhone(phone), code, password }),
  });
  const normalizedSession = normalizeWorkerSession(session);

  saveSession(normalizedSession);
  return normalizedSession;
}

export async function signInAdmin(): Promise<AppSession> {
  if (ENABLE_LOCAL_ADMIN_BYPASS && import.meta.env.DEV) {
    return signInLocalAdminForDev();
  }

  return signInAdminWithFirebase();
}

function signInLocalAdminForDev(): AppSession {
  const session: AppSession = {
    uid: "local-admin",
    role: "admin",
    name: "로컬 관리자",
    email: "local-admin@example.test",
    adminAccess: readLocalAdminAccess(),
  };

  saveSession(session);
  return session;
}

async function signInAdminWithFirebase(): Promise<AppSession> {
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

  const normalizedSession = {
    ...session,
    adminAccess: normalizeAdminAccess(session.adminAccess),
  };

  saveSession(normalizedSession);
  return normalizedSession;
}

function readLocalAdminAccess(): AdminAccess {
  return normalizeAdminAccess(import.meta.env.VITE_LOCAL_ADMIN_ACCESS);
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
