import { glass, radius } from "../../theme";

/**
 * CardContainer — Music.app grouped surface.
 * Soft fill, hairline, no machined bevel.
 */
export default function CardContainer({
  children,
  padding = 20,
  rounded = radius.lg,
  interactive = false,
  onClick = null,
  ariaLabel = null,
  style = {},
  className = "",
}) {
  const base = {
    position: "relative",
    borderRadius: rounded,
    border: `1px solid ${glass.borderSoft}`,
    background: glass.plate,
    boxShadow: glass.shadowSoft,
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

export { glassPill } from "../../theme";
