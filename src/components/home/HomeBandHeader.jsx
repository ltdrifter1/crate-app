import {
  homeSpace,
  indexLink,
  sectionEyebrow,
  sectionSubtitle,
  sectionTitlePoster,
} from "../../theme";

/**
 * HomeBandHeader — ONE left edge for every Home band.
 * Titles pad with homeSpace.gutter unless flush (nested in a glass stage).
 */
export default function HomeBandHeader({
  title,
  subtitle = null,
  eyebrow = null,
  meta = null,
  action = null,
  flush = false,
}) {
  return (
    <div
      className="pmp-band-header"
      style={{
        display: "grid",
        gridTemplateColumns: action || meta ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
        alignItems: "end",
        columnGap: 12,
        padding: flush ? 0 : `0 ${homeSpace.gutter}px`,
        marginBottom: homeSpace.titleToRail,
        minHeight: subtitle || eyebrow ? 52 : 36,
        borderBottom: "2px solid #F1E5D7",
        paddingBottom: 8,
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
          className="pmp-section-title"
          style={{
            ...sectionTitlePoster,
            overflow: "hidden",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="pmp-section-sub"
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
            ...indexLink,
            padding: 0,
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
            ...indexLink,
            marginBottom: subtitle ? 1 : 2,
            height: "auto",
            display: "inline-flex",
            alignItems: "center",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {action.label || "See all"} →
        </button>
      )}
    </div>
  );
}
