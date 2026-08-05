import { useEffect, useRef, useState } from "react";
import { color, fontDisplay, fontMono, motion } from "../../theme";
import { resolveVideoUrl, syncVideoToProgress, trackHasVideo } from "../../lib/video";

/**
 * Full-bleed music video plane — muted, synced to audio clock.
 */
export default function VideoStage({
  track = null,
  playing = false,
  progress = 0,
  dim = false,
}) {
  const videoRef = useRef(null);
  const url = resolveVideoUrl(track);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [track?.id, url]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !url || failed) return;
    syncVideoToProgress(el, progress, { playing });
  }, [progress, playing, url, failed, track?.id]);

  if (!url || failed || !trackHasVideo(track)) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        overflow: "hidden",
        background: "#0a0b0e",
      }}
    >
      <video
        ref={videoRef}
        key={url}
        src={url}
        muted
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: dim ? 0.55 : 1,
          transform: playing ? "scale(1.02)" : "scale(1)",
          transition: "opacity 0.5s ease, transform 8s ease",
        }}
      />
      {/* Broadcast letterbox veil — keeps chrome readable */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `
          linear-gradient(180deg, rgba(10,11,14,0.55) 0%, rgba(10,11,14,0.12) 28%, rgba(10,11,14,0.08) 55%, rgba(10,11,14,0.72) 100%),
          linear-gradient(90deg, rgba(10,11,14,0.35) 0%, transparent 18%, transparent 82%, rgba(10,11,14,0.35) 100%)
        `,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 8px",
        borderRadius: 4,
        background: "rgba(255,59,78,0.92)",
        color: "#fff",
        fontFamily: fontMono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
      }}>
        Video
      </div>
    </div>
  );
}

/** Small pill when a cut has a video. */
export function VideoBadge({ track, dark = false }) {
  if (!trackHasVideo(track)) return null;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 7px",
      borderRadius: 4,
      background: dark ? "rgba(255,59,78,0.9)" : "rgba(255,59,78,0.12)",
      color: dark ? "#fff" : "#FF3B4E",
      fontFamily: fontMono,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      animation: `fadeIn 0.3s ${motion.ease} both`,
    }}>
      ▶ Video
    </span>
  );
}

export function VideoEmptyHint() {
  return (
    <div style={{
      fontFamily: fontDisplay,
      fontSize: 12,
      color: color.faint,
    }}>
      Add a videoUrl on a track to go full TV mode
    </div>
  );
}
