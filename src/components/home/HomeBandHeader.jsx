import {
  color,
  fontDisplay,
  homeSpace,
  sectionEyebrow,
  sectionSubtitle,
  sectionTitle,
  y2k,
} from "../../theme";

/**
 * HomeBandHeader — ONE left edge for every Home band.
 * Title + rail always pad with homeSpace.gutter. No nested plates.
 */
export default function HomeBandHeader({
  title,
  subtitle = null,
  eyebrow = null,
  meta = null,
  action = null,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: action || meta ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
        alignItems: "start",
        columnGap: 12,
        padding: `0 ${homeSpace.gutter}px`,
        marginBottom: homeSpace.titleToRail,
        minHeight: subtitle || eyebrow ? 40 : 22,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div
            style={{
              ...sectionEyebrow,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            ...sectionTitle,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              ...sectionSubtitle,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {meta && !action && (
        <div
          style={{
            fontFamily: sectionEyebrow.fontFamily,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: color.muted,
            paddingTop: eyebrow ? 22 : 2,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {meta}
        </div>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            flexShrink: 0,
            marginTop: eyebrow ? 18 : 1,
            cursor: "pointer",
            padding: "7px 11px",
            height: 32,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.16)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%), rgba(18,20,24,0.42)",
            color: y2k.offWhite,
            fontFamily: fontDisplay,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.1,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {action.label || "View all"}
          <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1, color: color.muted }}>
            ›
          </span>
        </button>
      )}
    </div>
  );
}
