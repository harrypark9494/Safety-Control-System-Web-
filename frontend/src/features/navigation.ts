export const APP_NAVIGATION_EVENT = "safety-control:navigate";
export const SECURE_ENTRY_PATH = "/app/";

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
