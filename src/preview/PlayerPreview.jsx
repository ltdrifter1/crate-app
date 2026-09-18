/**
 * Dev-only player chrome preview — hash #player-preview.
 * Renders the real immersive player + desktop mini bar without auth.
 */
import { useEffect, useState } from "react";
import DesktopMiniPlayer from "../components/player/DesktopMiniPlayer";
import ImmersivePlayer from "../components/player/ImmersivePlayer";
import { PlayKey, OrbitalArtRing } from "../components/player/OrbitalControls";
import Icon from "../components/ui/Icon";
import { playerPlaybackStore } from "../lib/playerPlaybackStore";
import { playerTransportStore } from "../lib/playerTransportStore";
import { color } from "../theme";

const SAMPLE_COVER = "/brand/planet-mp3-lockup-on-black.png";

const SAMPLE_TRACK = {
  id: "preview-1",
  title: "Night Drive",
  artist: "Signal",
  albumCover: SAMPLE_COVER,
  color: "#C9CED6",
  liked: false,
  disliked: false,
  duration: 214,
  bpm: 124,
  energy: 6,
  camelot: "8A",
  genre: "Electronic",
};

function dockTintStyle() {
  return {};
}

export default function PlayerPreview() {
  const [track, setTrack] = useState(SAMPLE_TRACK);
  const [immersive, setImmersive] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    playerPlaybackStore.setDuration(214);
    playerPlaybackStore.setProgress(48);
    playerTransportStore.setTrack(SAMPLE_TRACK);
    playerTransportStore.setPlaying(true);
    return () => {
      playerTransportStore.setPlaying(false);
    };
  }, []);

  const togglePlay = () => {
    setPlaying((v) => {
      playerTransportStore.setPlaying(!v);
      return !v;
    });
  };

  return (
    <div style={{ minHeight: "100dvh", background: color.canvas, position: "relative" }}>
      <style>{`
        @keyframes flaskShake {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          18% { transform: rotate(-7deg) translateY(0.5px); }
          36% { transform: rotate(6deg) translateY(-0.5px); }
          54% { transform: rotate(-4deg) translateY(0.25px); }
          72% { transform: rotate(3deg); }
          88% { transform: rotate(-1.5deg); }
        }
        @keyframes flaskBubbleRise {
          0% { transform: translateY(0) scale(0.65); opacity: 0; }
          18% { opacity: 0.95; }
          100% { transform: translateY(-8px) scale(1.05); opacity: 0; }
        }
        @keyframes flaskSteamRise {
          0% { transform: translateY(0) scaleX(0.85); opacity: 0; }
          28% { opacity: 0.7; }
          100% { transform: translateY(-9px) scaleX(1.35); opacity: 0; }
        }
        .flask-taste-btn { position: relative; overflow: visible; }
        .flask-taste-btn:hover:not(:disabled) .flask-taste-mark {
          animation: flaskShake 0.58s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          transform-origin: 50% 78%;
        }
        .flask-taste-btn .flask-bubble {
          transform-box: fill-box; transform-origin: center;
          animation: flaskBubbleRise 2.4s ease-in-out infinite;
          animation-play-state: paused;
        }
        .flask-taste-btn .flask-steam {
          transform-box: fill-box; transform-origin: center bottom;
          animation: flaskSteamRise 2.1s ease-out infinite;
          animation-play-state: paused;
        }
        .flask-taste-btn:hover:not(:disabled) .flask-bubble,
        .flask-taste-btn:hover:not(:disabled) .flask-steam,
        .flask-taste-btn.is-active .flask-bubble,
        .flask-taste-btn.is-active .flask-steam { animation-play-state: running; }
        @keyframes dockRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes energyMenuIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>

      {!immersive && (
        <DesktopMiniPlayer
          track={track}
          isRadioMode
          onOpen={() => setImmersive(true)}
          onTogglePlay={togglePlay}
          onSkip={() => {}}
          onLikeToggle={() => setTrack((t) => ({ ...t, liked: !t.liked, disliked: false }))}
          onDislike={() => setTrack((t) => ({ ...t, disliked: true, liked: false }))}
          onSeek={(n) => playerPlaybackStore.setProgress(n)}
          OrbitalArtRing={OrbitalArtRing}
          PlayKey={PlayKey}
          Icon={Icon}
          dockTintStyle={dockTintStyle}
        />
      )}

      {immersive && (
        <ImmersivePlayer
          currentTrack={track}
          onTogglePlay={togglePlay}
          onSkip={() => setImmersive(false)}
          onPrev={() => {}}
          onClose={() => setImmersive(false)}
          onSeek={(n) => playerPlaybackStore.setProgress(n)}
          onLike={() => setTrack((t) => ({ ...t, liked: !t.liked, disliked: false }))}
          onDislike={() => setTrack((t) => ({ ...t, disliked: true, liked: false }))}
          isRadioMode
          Icon={Icon}
          PlayKey={PlayKey}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 120,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setImmersive((v) => !v)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(8,10,13,0.72)",
            color: color.ink,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {immersive ? "Show player bar" : "Show immersive"}
        </button>
      </div>
    </div>
  );
}
