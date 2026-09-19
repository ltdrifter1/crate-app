import { color, fontDisplay, homeSpace, motion, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";
import DefaultSleeve from "../ui/DefaultSleeve";

function PlateArt({ plate, eager = false }) {
  const sleeve = plate.photo || plate.covers?.[0] || null;
  if (sleeve) {
    return (
      <CoverImage
        src={sleeve}
        alt=""
        width={320}
        height={200}
        eager={eager}
        objectPosition={plate.photoFocus || "center"}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <DefaultSleeve size={160} />;
}

/**
 * Genre mosaic — Apple Music Browse density, Mixmag photography.
 * Two columns on phone, up to four on desktop. One sleeve per plate.
 */
export default function GenreMosaic({ plates = [], onOpen = null }) {
  if (!plates.length) return null;

  return (
    <div
      className="pmp-explore-mosaic"
      style={{
        padding: `0 ${homeSpace.gutter}px`,
      }}
    >
      {plates.map((plate, i) => (
        <button
          key={plate.lane}
          type="button"
          className="pmp-lift pmp-explore-genre"
          onClick={() => onOpen?.({ type: "genre", id: plate.lane })}
          aria-label={plate.lane}
          style={{
            position: "relative",
            display: "block",
            width: "100%",
            padding: 0,
            border: "1px solid rgba(216,223,232,0.12)",
            borderRadius: 14,
            overflow: "hidden",
            aspectRatio: "16 / 10",
            background: y2k.artGradient,
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
            animation: `rise 0.45s ${motion.ease} ${Math.min(i, 8) * 0.03}s both`,
            boxShadow: "0 10px 24px rgba(58,66,80,0.32)",
          }}
        >
          <PlateArt plate={plate} eager={i < 2} />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(165deg, rgba(255,255,255,0.22) 0%, transparent 36%),
                linear-gradient(180deg, rgba(58,66,80,0.05) 0%, rgba(58,66,80,0.55) 100%),
                linear-gradient(90deg, rgba(58,66,80,0.28) 0%, transparent 60%)
              `,
            }}
          />
          <span
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              zIndex: 1,
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: fontDisplay,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: -0.4,
                lineHeight: 1.1,
                color: color.onDark,
              }}
            >
              {plate.lane}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function MoodRail({ plates = [], onOpen = null }) {
  if (!plates.length) return null;
  return (
    <div
      className="hide-scroll pmp-rail"
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        padding: `2px ${homeSpace.gutter}px 6px`,
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {plates.map((mood) => (
        <button
          key={mood.id}
          type="button"
          className="pmp-lift"
          onClick={() => onOpen?.({ type: "mood", id: mood.id })}
          aria-label={`${mood.label} — ${mood.blurb}`}
          style={{
            flex: "0 0 auto",
            scrollSnapAlign: "start",
            width: 148,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "block",
              width: 148,
              height: 196,
              borderRadius: 14,
              overflow: "hidden",
              background: y2k.artGradient,
              boxShadow: "0 10px 24px rgba(58,66,80,0.36)",
              border: "1px solid rgba(216,223,232,0.1)",
            }}
          >
            {mood.photo ? (
              <CoverImage
                src={mood.photo}
                alt=""
                width={160}
                height={212}
                objectPosition={mood.photoFocus}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <DefaultSleeve size={148} />
            )}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(58,66,80,0.05) 20%, rgba(58,66,80,0.82) 100%)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 12,
                right: 12,
                bottom: 12,
                fontFamily: fontDisplay,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: -0.35,
                color: color.onDark,
                lineHeight: 1.15,
              }}
            >
              {mood.label}
            </span>
          </span>
          <span
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 12,
              fontWeight: 500,
              color: color.muted,
              lineHeight: 1.3,
            }}
          >
            {mood.blurb}
          </span>
        </button>
      ))}
    </div>
  );
}

export function SceneRail({ plates = [], onOpen = null }) {
  if (!plates.length) return null;
  return (
    <div
      className="hide-scroll pmp-rail"
      style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        padding: `2px ${homeSpace.gutter}px 6px`,
        scrollSnapType: "x proximity",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {plates.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className="pmp-lift"
          onClick={() => onOpen?.({ type: "scene", id: scene.id })}
          aria-label={scene.label}
          style={{
            flex: "0 0 auto",
            scrollSnapAlign: "start",
            width: 168,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "block",
              width: 168,
              height: 112,
              borderRadius: 12,
              overflow: "hidden",
              background: y2k.artGradient,
              boxShadow: "0 10px 22px rgba(58,66,80,0.34)",
              border: "1px solid rgba(216,223,232,0.1)",
            }}
          >
            {scene.photo || scene.covers?.[0] ? (
              <CoverImage
                src={scene.photo || scene.covers[0]}
                alt=""
                width={168}
                height={112}
                objectPosition={scene.photoFocus}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <DefaultSleeve size={112} />
            )}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 30%, rgba(58,66,80,0.78) 100%)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                bottom: 10,
                fontFamily: fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: color.onDark,
              }}
            >
              {scene.label}
            </span>
          </span>
          <span
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 12,
              color: color.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {scene.cities?.[0] || scene.familyLabel}
          </span>
        </button>
      ))}
    </div>
  );
}
