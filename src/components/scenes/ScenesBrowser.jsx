import { useMemo, useState } from "react";
import { font, fontDisplay, fontMono, color, radius } from "../../theme";
import {
  scenesByFamily,
  relatedScenes,
  getScene,
  SCENE_FAMILIES,
} from "../../lib/scenes";
import { atmosphereGradient } from "../../lib/rooms";

/**
 * Editorial scene browser — families, scenes, related graph.
 * Curiosity over chips: each scene opens a story + related lanes.
 */
export default function ScenesBrowser({
  tracks,
  onOpenSceneRoom,
  onPlayScene,
}) {
  const families = useMemo(() => scenesByFamily(tracks), [tracks]);
  const [activeId, setActiveId] = useState(null);
  const active = activeId ? getScene(activeId) : null;
  const related = active ? relatedScenes(active.id) : [];

  if (active) {
    return (
      <div style={{ padding: "8px 0 32px", fontFamily: font, animation: "fadeIn 0.3s ease both" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: 200,
            padding: "20px 20px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            marginBottom: 8,
          }}
        >
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, background: atmosphereGradient(active.atmosphere || "night-fog") }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(12,11,10,0.2) 0%, rgba(12,11,10,0.94) 100%)",
            }}
          />
          <button
            type="button"
            onClick={() => setActiveId(null)}
            style={{
              position: "relative",
              zIndex: 1,
              alignSelf: "flex-start",
              marginBottom: 16,
              background: "none",
              border: "none",
              color: color.muted,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← All scenes
          </button>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.8,
                color: color.accent,
                fontFamily: fontMono,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {SCENE_FAMILIES.find((f) => f.id === active.familyId)?.label || "Scene"}
              {active.cities?.length ? ` · ${active.cities.slice(0, 2).join(" · ")}` : ""}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(28px, 8vw, 40px)",
                fontWeight: 800,
                letterSpacing: -1.2,
                fontFamily: fontDisplay,
                color: color.onDark,
                lineHeight: 1.05,
              }}
            >
              {active.label}
            </h2>
            <p style={{ margin: "12px 0 0", fontSize: 14, color: color.body, lineHeight: 1.5, maxWidth: 360 }}>
              {active.story}
            </p>
            <div
              style={{
                marginTop: 12,
                fontFamily: fontMono,
                fontSize: 11,
                color: color.faint,
                letterSpacing: 0.3,
              }}
            >
              {active.bpm ? `${active.bpm[0]}–${active.bpm[1]} BPM` : null}
              {active.bpm && active.energy ? " · " : ""}
              {active.energy ? `E${active.energy[0]}–${active.energy[1]}` : null}
              {" · "}
              lane {active.lane}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button
                type="button"
                className="play-primary"
                onClick={() => onPlayScene?.(active.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: radius.sm,
                  border: "none",
                  background: color.accent,
                  color: color.onAccent,
                  fontWeight: 650,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Play scene
              </button>
              <button
                type="button"
                onClick={() => onOpenSceneRoom?.(active.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: radius.sm,
                  border: `1px solid ${color.lineStrong}`,
                  background: "none",
                  color: color.body,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Enter room
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 650, fontFamily: fontDisplay, color: color.ink, marginBottom: 6 }}>
              Related scenes
            </div>
            <div style={{ fontSize: 12, color: color.muted, marginBottom: 12 }}>
              Culture as a graph — not a flat genre list
            </div>
            {related.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "14px 4px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${color.line}`,
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fontDisplay }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: color.muted, marginTop: 3 }}>
                    {s.story.split("—")[0].trim()}
                  </div>
                </div>
                <span style={{ color: color.faint, fontSize: 12, alignSelf: "center" }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 20px 32px", fontFamily: font }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.8,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Taxonomy
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 750,
            fontFamily: fontDisplay,
            letterSpacing: -0.5,
            color: color.ink,
          }}
        >
          Scenes, not shelves
        </h2>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: color.muted, lineHeight: 1.5, maxWidth: 340 }}>
          UK Garage stays UK Garage. Techno isn’t “House.” Follow the graph.
        </p>
      </div>

      {families.map((family) => (
        <section key={family.id} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 750, fontFamily: fontDisplay, color: color.ink, letterSpacing: -0.3 }}>
            {family.label}
          </div>
          <div style={{ fontSize: 12, color: color.faint, margin: "4px 0 10px" }}>{family.story}</div>
          {family.scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setActiveId(scene.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "14px 4px",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${color.line}`,
                cursor: "pointer",
                textAlign: "left",
                color: color.ink,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: fontDisplay, letterSpacing: -0.2 }}>
                  {scene.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: color.muted,
                    marginTop: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {scene.cities?.slice(0, 2).join(" · ") || scene.story.split("—")[0].trim()}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: color.faint,
                  fontFamily: fontMono,
                  fontVariantNumeric: "tabular-nums",
                  marginLeft: 12,
                }}
              >
                {scene.count}
              </div>
            </button>
          ))}
        </section>
      ))}

      {families.length === 0 && (
        <div style={{ color: color.muted, fontSize: 14, padding: "24px 0" }}>
          Load a catalog to see which scenes are alive in your library.
        </div>
      )}
    </div>
  );
}
