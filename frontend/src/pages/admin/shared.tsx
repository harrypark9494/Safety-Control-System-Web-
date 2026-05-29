import type { CSSProperties } from "react";

export function Bar({ value, color = "navy" }: { value: string; color?: "navy" | "green" | "orange" | "red" | "slate" }) {
  return <i className={`bar bar-${color}`} style={{ "--value": value } as CSSProperties & Record<"--value", string>} />;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
