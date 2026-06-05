interface LogoProps {
  height?: number;
  className?: string;
  /** "dark" = white logo for dark backgrounds, "light" = black for white backgrounds */
  variant?: "dark" | "light";
}

export function InfraAuditLogo({ height = 28, className = "", variant = "light" }: LogoProps) {
  const filter = variant === "dark" ? "brightness(0) invert(1)" : "none";
  return (
    <img
      src="/logo.svg"
      alt="InfraAudit"
      height={height}
      style={{ height, width: "auto", filter, display: "block" }}
      className={className}
    />
  );
}
