import type { AdminAccess, AppSession, WorkerSession } from "../../types";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import { requestAdminLogin, requestWorkerLogin } from "../../api/authApi";
import { clearSecureEntryPath } from "../navigation";
import { normalizeAdminAccess } from "./adminAccess";

const SESSION_KEY = "safetyControlSession";
const ADMIN_GOOGLE_DOMAIN = import.meta.env.VITE_ADMIN_GOOGLE_DOMAIN ?? "";
const ENABLE_LOCAL_ADMIN_BYPASS = import.meta.env.VITE_ENABLE_LOCAL_ADMIN_BYPASS === "true";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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

function normalizeWorkerSession(session: WorkerSession): WorkerSession {
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

export async function signInWorker(
  projectId: string,
  phone: string,
  code: string,
  password: string,
  name: string,
): Promise<WorkerSession> {
  const session = await requestWorkerLogin(projectId, phone, code, password, name);
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
  const session = await requestAdminLogin(idToken);

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
