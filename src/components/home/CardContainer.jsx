import { glassPill, radio } from "../../theme";

/**
 * CardContainer — machined Home surface.
 * Graphite plate + hairline rim + restrained bevel (hardware module, not soft glass).
 */
export default function CardContainer({
  children,
  padding = 20,
  rounded = radio.radius,
  interactive = false,
  onClick = null,
  ariaLabel = null,
  style = {},
  className = "",
}) {
  const base = {
    position: "relative",
    borderRadius: rounded,
    border: radio.border,
    background: radio.moduleFace,
    boxShadow: radio.moduleShadow,
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
