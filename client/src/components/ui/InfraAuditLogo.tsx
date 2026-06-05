interface LogoProps {
  height?: number;
  className?: string;
  /** "dark" = white logo for dark backgrounds, "light" = black for white backgrounds */
  variant?: "dark" | "light";
}

// SVG intrinsic viewBox: 751.5 × 257.25 → aspect ≈ 2.92
const ASPECT = 751.5 / 257.25;

export function InfraAuditLogo({ height = 36, className = "", variant = "light" }: LogoProps) {
  const filter = variant === "dark" ? "brightness(0) invert(1)" : "none";
  const width = Math.round(height * ASPECT);
  return (
    <img
      src="/logo.svg"
      alt="InfrAudit"
      style={{
        height: `${height}px`,
        width: `${width}px`,
        objectFit: "contain",
        filter,
        display: "block",
        flexShrink: 0,
      }}
      className={className}
    />
  );
}
