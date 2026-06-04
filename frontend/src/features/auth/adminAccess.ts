import type { AdminAccess } from "../../types";

export const adminAccessLabels: Record<AdminAccess, string> = {
  workspace: "워크스페이스 전체 권한",
  schedule: "스케줄 감독",
  qr: "QR코드 관리자",
};

export const adminAccessDescriptions: Record<AdminAccess, string> = {
  workspace: "모든 어드민 시스템에 접근할 수 있습니다.",
  schedule: "스케줄 운영 화면에 접근할 수 있습니다.",
  qr: "식권/생수 QR 사용 현황만 접근할 수 있습니다.",
};

export function normalizeAdminAccess(value: unknown): AdminAccess {
  return value === "schedule" || value === "qr" || value === "workspace" ? value : "workspace";
}
