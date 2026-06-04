import type { AdminAccess } from "../../types";

export function normalizeAdminAccess(value: unknown): AdminAccess {
  return value === "schedule" || value === "qr" || value === "workspace" ? value : "workspace";
}
