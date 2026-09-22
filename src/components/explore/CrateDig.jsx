/**
 * CrateDig — one button that drops you on a random unexpected track.
 * The anti-algorithm. Pull something you didn't go looking for.
 */
import { useState, useCallback } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace,
  neons, radio, trim,
} from "../../theme";
import CoverImage from "../ui/CoverImage";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";

function randomFrom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick a track that's genuinely obscure — low plays, not recently seen. */
function pickDigTrack(tracks = [], excluding = null) {
  const pool = tracks.filter(
    (t) =>
      t &&
      t.id !== excluding?.id &&
      (t.duration || 0) <= 900 &&
      (t.duration || 0) > 0
  );
  if (!pool.length) return randomFrom(tracks.filter((t) => t.id !== excluding?.id));

  // Prefer low-play, low-like obscure tracks for that "rare find" feeling
  const obscure = pool.filter((t) => (t.playCount || 0) <= 2 && (t.likeCount || 0) === 0);
  if (obscure.length > 3) return randomFrom(obscure);

  // Fall back to anything with low plays
  const lowPlay = pool.filter((t) => (t.playCount || 0) <= 5);
  if (lowPlay.length > 2) return randomFrom(lowPlay);

  return randomFrom(pool);
}

export default function CrateDig({ tracks = [], onPlay = null }) {
  const [pick, setPick] = useState(null);
  const [flipping, setFlipping] = useState(false);

  const dig = useCallback(() => {
    setFlipping(true);
    setTimeout(() => {
      const next = pickDigTrack(tracks, pick);
      setPick(next);
      setFlipping(false);
    }, 220);
  }, [tracks, pick]);

  const hasTracks = tracks.length > 0;
  const coverUrl = pick ? catalogSleeveUrl(pick.albumCover) : null;

  return (
    <div
      style={{
        margin: `${homeSpace.sectionGap}px ${homeSpace.gutter}px 0`,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.18,
            textTransform: "uppercase",
            color: neons.cyan,
            marginBottom: 3,
          }}
        >
          Crate Dig
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.35,
            color: color.ink,
          }}
        >
          Something you didn't go looking for.
        </div>
        <div
          style={{
            fontSize: 13,
            color: color.muted,
            marginTop: 3,
            lineHeight: 1.45,
          }}
        >
          One random pull from the crate. No algorithm. No reason.
        </div>
      </div>

      {/* Dig panel */}
      <div
        style={{
          borderRadius: 14,
          background: radio.moduleFace,
          border: "1px solid rgba(91,101,116,0.18)",
          boxShadow:
            "inset 0 1px 0 rgba(216,223,232,0.45), 0 10px 28px rgba(58,66,80,0.16)",
          overflow: "hidden",
        }}
      >
        {/* Record slot — shows the pulled track */}
        <div
          style={{
            padding: "20px 18px",
            minHeight: 110,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: radio.lcdFace,
            borderBottom: radio.lcdBorder,
          }}
        >
          {pick ? (
            <>
              {/* Album art */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 6,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid rgba(216,223,232,0.18)",
                  background: "rgba(58,66,80,0.55)",
                  opacity: flipping ? 0.1 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {coverUrl ? (
                  <CoverImage
                    src={pick.albumCover}
                    alt=""
                    width={72}
                    height={72}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: fontDisplay,
                      fontWeight: 700,
                      fontSize: 24,
                      color: "rgba(183,228,238,0.5)",
                    }}
                  >
                    {(pick.title || "?")[0]}
                  </div>
                )}
              </div>

              {/* Track info */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  opacity: flipping ? 0 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <div
                  style={{
                    fontFamily: fontMono,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 0.06,
                    color: neons.phosphor,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pick.title}
                </div>
                <div
                  style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.1,
                    textTransform: "uppercase",
                    color: color.lcdMute,
                    marginTop: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pick.artist}
                </div>
                {pick.genre && (
                  <div
                    style={{
                      marginTop: 6,
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      border: `1px solid ${neons.cyan}44`,
                      fontFamily: fontMono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: 0.18,
                      textTransform: "uppercase",
                      color: neons.cyan,
                    }}
                  >
                    {pick.genre}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.12,
                color: color.lcdMute,
                textTransform: "uppercase",
              }}
            >
              {hasTracks ? "Hit dig — see what comes up." : "Loading crate…"}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={dig}
            disabled={!hasTracks || flipping}
            style={{
              flex: 1,
              padding: "13px 20px",
              borderRadius: 10,
              border: `1px solid ${neons.cyan}66`,
              background: radio.lcdFace,
              boxShadow: `0 0 16px ${neons.cyanGlow}, inset 0 1px 0 rgba(216,223,232,0.1)`,
              fontFamily: fontMono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.18,
              textTransform: "uppercase",
              color: neons.phosphor,
              cursor: hasTracks && !flipping ? "pointer" : "wait",
              opacity: !hasTracks ? 0.4 : 1,
              transition: "opacity 0.2s, box-shadow 0.2s",
            }}
          >
            {flipping ? "…" : pick ? "Dig Again" : "Dig"}
          </button>

          {pick && onPlay && (
            <button
              type="button"
              onClick={() => onPlay(pick, null)}
              style={{
                flex: 1,
                padding: "13px 20px",
                borderRadius: 10,
                border: `1px solid ${neons.lime}66`,
                background: "rgba(109,191,135,0.1)",
                boxShadow: `0 0 14px ${neons.limeGlow}`,
                fontFamily: fontMono,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.18,
                textTransform: "uppercase",
                color: neons.lime,
                cursor: "pointer",
              }}
            >
              Play It
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
