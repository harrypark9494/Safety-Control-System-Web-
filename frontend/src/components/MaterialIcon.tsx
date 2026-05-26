import type { CSSProperties } from "react";

type MaterialIconProps = {
  name: string;
  className?: string;
  filled?: boolean;
};

export function MaterialIcon({ name, className = "", filled = false }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-rounded material-icon ${className}`.trim()}
      aria-hidden="true"
      style={{ "--icon-fill": filled ? 1 : 0 } as CSSProperties & Record<"--icon-fill", number>}
    >
      {name}
    </span>
  );
}
