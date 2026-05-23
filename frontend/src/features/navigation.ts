export const APP_NAVIGATION_EVENT = "safety-control:navigate";
const SECURE_ENTRY_TOKEN_KEY = "safetyControlSecureEntryToken";
const SECURE_ENTRY_PREFIX = "/s";

function createSecureEntryToken(): string {
  const bytes = new Uint8Array(16);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getSecureEntryPath(): string {
  const existingToken = window.sessionStorage.getItem(SECURE_ENTRY_TOKEN_KEY);
  const token = existingToken ?? createSecureEntryToken();

  if (!existingToken) {
    window.sessionStorage.setItem(SECURE_ENTRY_TOKEN_KEY, token);
  }

  return `${SECURE_ENTRY_PREFIX}/${token}`;
}

export function isSecureEntryPath(path: string): boolean {
  const token = window.sessionStorage.getItem(SECURE_ENTRY_TOKEN_KEY);

  if (!token) {
    return false;
  }

  return path.replace(/\/+$/, "") === `${SECURE_ENTRY_PREFIX}/${token}`;
}

export function clearSecureEntryPath(): void {
  window.sessionStorage.removeItem(SECURE_ENTRY_TOKEN_KEY);
}

export function navigateTo(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(APP_NAVIGATION_EVENT));
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function replaceWith(path: string): void {
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new Event(APP_NAVIGATION_EVENT));
  window.scrollTo({ top: 0, behavior: "auto" });
}
