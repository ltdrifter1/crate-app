import { glass, glassPill, radius } from "../../theme";

/**
 * CardContainer — frosted Home surface.
 * Soft plate + hairline rim light + blur (iOS glass, not flat fill).
 */
export default function CardContainer({
  children,
  padding = 20,
  rounded = radius.xl,
  interactive = false,
  onClick = null,
  ariaLabel = null,
  style = {},
  className = "",
}) {
  const base = {
    position: "relative",
    borderRadius: rounded,
    border: "1px solid rgba(255,255,255,0.14)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 42%, transparent 100%), rgba(22,25,30,0.58)",
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.2),
      inset 0 -1px 0 rgba(0,0,0,0.35),
      ${glass.shadowSoft}
    `,
    backdropFilter: "blur(22px) saturate(1.25)",
    WebkitBackdropFilter: "blur(22px) saturate(1.25)",
    padding,
    ...style,
  };

  if (!interactive) {
    return (
      <div className={className} style={base}>
        {children}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || undefined}
      onClick={onClick || undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      className={`pmp-lift ${className}`}
      style={{ ...base, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </div>
  );
}

export { glassPill };
