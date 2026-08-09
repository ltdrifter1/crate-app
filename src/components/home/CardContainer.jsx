import { glass, radius } from "../../theme";

/**
 * CardContainer — the one card surface for Home.
 * 16–20px radius, hairline border, soft shadow, dark plate.
 * Set `interactive` for hover lift + press feedback.
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
    border: `1px solid ${glass.border}`,
    background: glass.plate,
    boxShadow: `
      inset 0 1px 0 ${glass.highlight},
      inset 0 -1px 0 rgba(0,0,0,0.35),
      ${glass.shadowSoft}
    `,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
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
