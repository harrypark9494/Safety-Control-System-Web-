import { demoWorkers } from "../../data/demoData";
import type { AppSession, DemoWorkerAccount, WorkerSession } from "../../types";

const SESSION_KEY = "safetyControlUser";

function toWorkerSession(account: DemoWorkerAccount): WorkerSession {
  return {
    uid: account.uid,
    role: "worker",
    name: account.name,
    phone: account.phone,
    workType: account.workType,
    team: account.team,
    supervisor: account.supervisor,
    schedule: "05.20(수) 09:00-18:00 / A현장 2구역",
    status: "출근 확인",
    payrollDocumentStatus: account.payrollDocumentStatus,
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

export function findDemoWorker(phone: string): DemoWorkerAccount | undefined {
  return demoWorkers.find((worker) => worker.phone === phone);
}

export function signInDemoWorker(
  phone: string,
  code: string,
  password: string,
  name?: string,
  workType?: DemoWorkerAccount["workType"],
): WorkerSession {
  const worker = findDemoWorker(phone);

  if (!worker) {
    throw new Error("등록된 작업자를 찾을 수 없습니다.");
  }

  if (name && worker.name !== name.trim()) {
    throw new Error("등록된 이름과 연락처가 일치하지 않습니다.");
  }

  if (workType && worker.workType !== workType) {
    throw new Error("선택한 고용 유형과 등록 계정이 일치하지 않습니다.");
  }

  if (code !== worker.code) {
    throw new Error("인증 코드가 일치하지 않습니다.");
  }

  if (password !== worker.password) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  const session = toWorkerSession(worker);
  saveSession(session);
  return session;
}

export function signInDemoAdmin(): AppSession {
  const session: AppSession = {
    uid: "admin-demo",
    role: "admin",
    name: "관리자 A",
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
