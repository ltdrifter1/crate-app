import {
  color,
  fontDisplay,
  fontLcd,
  homeSpace,
  sectionEyebrowLcd,
  sectionSubtitle,
  sectionTitlePoster,
  y2k,
} from "../../theme";

/**
 * HomeBandHeader — ONE left edge for every Home band.
 * App Store–clean title stack; titles always pad with homeSpace.gutter.
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
        alignItems: "end",
        columnGap: 12,
        padding: `0 ${homeSpace.gutter}px`,
        marginBottom: homeSpace.titleToRail,
        minHeight: subtitle || eyebrow ? 44 : 26,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div
            style={{
              ...sectionEyebrowLcd,
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
            ...sectionTitlePoster,
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
            fontFamily: fontLcd,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: y2k.cyan,
            paddingBottom: subtitle ? 2 : 4,
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
          className="pmp-view-all"
          style={{
            flexShrink: 0,
            marginBottom: subtitle ? 1 : 2,
            cursor: "pointer",
            padding: "6px 2px",
            height: 32,
            border: "none",
            background: "transparent",
            color: color.accent,
            fontFamily: fontDisplay,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: -0.2,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {action.label || "See All"}
        </button>
      )}
    </div>
  );
}
