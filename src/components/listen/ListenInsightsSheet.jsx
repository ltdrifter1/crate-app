/**
 * Full-screen interests sheet — thin wrapper around InterestsPanel.
 * Prefer Club → Interests settings tab for primary entry.
 */
import { color, radius, glass, aluminumGradient } from "../../theme";
import { InterestsPanel } from "./InterestsPanel";

export default function ListenInsightsSheet({
  onClose,
  tracks = [],
  genres = [],
  recentTracks = [],
  signalLabel = null,
  onEditGenres = null,
  onPlayTrack = null,
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: aluminumGradient() }} />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(190,198,210,0.32) 0%, transparent 50%)",
        }}
      />

      <div
        className="hide-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px 20px 8px",
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: glass.fillStrong,
              border: `1px solid ${glass.borderSoft}`,
              borderRadius: radius.md,
              width: 36,
              height: 36,
              cursor: "pointer",
              color: color.muted,
              fontSize: 18,
              lineHeight: 1,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: "4px 22px 56px",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
        }}>
          <InterestsPanel
            tracks={tracks}
            genres={genres}
            recentTracks={recentTracks}
            signalLabel={signalLabel}
            onEditGenres={onEditGenres}
            onPlayTrack={onPlayTrack}
            showIntro
          />
        </div>
      </div>
    </div>
  );
}
