/**
 * CrateDig — one button that drops you on a random unexpected track.
 * The anti-algorithm. Pull something you didn't go looking for.
 *
 * Presented as a crate you physically pull from: a slot that shows the sleeve
 * you got, a pull counter so digging feels collected, and a stamped reason the
 * cut is a find. Ink comes from the track's own scene, never a decorative hue.
 */
import { useState, useCallback, useMemo } from "react";
import {
  color, fontDisplay, fontMono, hardware, homeSpace,
  neons, radio,
} from "../../theme";
import CoverImage from "../ui/CoverImage";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";
import { SCENE_CHANNELS } from "../../lib/sceneChannels";
import { normalizeGenre } from "../../lib/genres";

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

/**
 * Station ink for the pulled cut — the same colour the dial gives its scene.
 * Uses each channel's own classifier so Dig and Channel Surfing always agree.
 */
function inkForTrack(track) {
  if (!track) return null;
  const genre = normalizeGenre(track.genre);
  const hit =
    SCENE_CHANNELS.find((c) => typeof c.match === "function" && c.match(track)) ||
    SCENE_CHANNELS.find(
      (c) =>
        c.vibe === track.vibe ||
        (c.genres || []).includes(genre) ||
        (c.scenes || []).includes(track.scene) ||
        c.title === genre
    );
  return hit?.accent || null;
}

/** Why this cut counts as a find — printed, not inferred marketing. */
function findStamp(track) {
  if (!track) return null;
  const plays = track.playCount || 0;
  if (plays === 0) return "Never played here";
  if (plays <= 2) return `Only ${plays} play${plays === 1 ? "" : "s"}`;
  if (!(track.likeCount || 0)) return "Nobody's claimed it";
  return "Deep in the crate";
}

export default function CrateDig({ tracks = [], onPlay = null }) {
  const [pick, setPick] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [pulls, setPulls] = useState(0);

  const dig = useCallback(() => {
    setFlipping(true);
    setTimeout(() => {
      const next = pickDigTrack(tracks, pick);
      setPick(next);
      setPulls((n) => n + 1);
      setFlipping(false);
    }, 220);
  }, [tracks, pick]);

  const hasTracks = tracks.length > 0;
  const coverUrl = pick ? catalogSleeveUrl(pick.albumCover) : null;
  const ink = useMemo(() => inkForTrack(pick), [pick]);
  const stamp = useMemo(() => findStamp(pick), [pick]);

  return (
    <div style={{ margin: `${homeSpace.sectionGap}px ${homeSpace.gutter}px 0` }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.18,
              textTransform: "uppercase",
              color: neons.cyan,
            }}
          >
            Crate Dig
          </span>
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.16,
              textTransform: "uppercase",
              color: pulls ? color.body : color.faint,
            }}
          >
            {pulls ? `${pulls} pull${pulls === 1 ? "" : "s"} today` : `${tracks.length} in the crate`}
          </span>
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
        <div style={{ fontSize: 13, color: color.muted, marginTop: 3, lineHeight: 1.45 }}>
          One random pull from the crate. No algorithm. No reason.
        </div>
      </div>

      {/* Crate */}
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
        {/* Slot — the sleeve you pulled */}
        <div
          style={{
            position: "relative",
            padding: "18px",
            minHeight: 116,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: radio.lcdFace,
            borderBottom: radio.lcdBorder,
          }}
        >
          {/* Station ink spine down the slot edge */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              background: ink || "rgba(183,228,238,0.22)",
              opacity: flipping ? 0.2 : 1,
              transition: "background 0.28s ease, opacity 0.2s ease",
            }}
          />

          {pick ? (
            <>
              {/* Sleeve */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 4,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid rgba(216,223,232,0.18)",
                  background: "rgba(58,66,80,0.55)",
                  boxShadow: "0 6px 16px rgba(20,26,34,0.45)",
                  opacity: flipping ? 0.1 : 1,
                  transform: flipping ? "translateY(6px)" : "none",
                  transition: "opacity 0.2s ease, transform 0.24s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                {coverUrl ? (
                  <CoverImage
                    src={pick.albumCover}
                    alt=""
                    width={76}
                    height={76}
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
                      fontSize: 26,
                      color: ink || "rgba(183,228,238,0.5)",
                    }}
                  >
                    {(pick.title || "?")[0]}
                  </div>
                )}
              </div>

              {/* Readout */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  opacity: flipping ? 0 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                {stamp && (
                  <div
                    style={{
                      display: "inline-block",
                      marginBottom: 5,
                      padding: "2px 7px",
                      borderRadius: 3,
                      border: `1px solid ${ink || neons.cyan}`,
                      fontFamily: fontMono,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                      textTransform: "uppercase",
                      color: ink || neons.phosphor,
                    }}
                  >
                    {stamp}
                  </div>
                )}
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
                  {pick.genre ? ` · ${pick.genre}` : ""}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textAlign: "center",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily: fontMono,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "rgba(183,228,238,0.32)",
                }}
              >
                ▚▚▚
              </span>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.12,
                  color: color.lcdMute,
                  textTransform: "uppercase",
                }}
              >
                {hasTracks ? "Reach in. See what comes up." : "Loading crate…"}
              </span>
            </div>
          )}
        </div>

        {/* Controls — the pull handle */}
        <div
          style={{
            padding: 12,
            display: "flex",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          <button
            type="button"
            onClick={dig}
            disabled={!hasTracks || flipping}
            className="pmp-press"
            style={{
              flex: pick ? "0 0 auto" : "1 1 auto",
              minWidth: pick ? 128 : 0,
              padding: "0 22px",
              minHeight: 46,
              borderRadius: hardware.radius,
              border: "1px solid rgba(91,101,116,0.28)",
              background: hardware.keyFace,
              boxShadow: hardware.keyRaised,
              fontFamily: fontMono,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              color: color.ink,
              cursor: hasTracks && !flipping ? "pointer" : "wait",
              opacity: !hasTracks ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {flipping ? "···" : pick ? "Dig again" : "Dig"}
          </button>

          {pick && onPlay && (
            <button
              type="button"
              onClick={() => onPlay(pick, null)}
              className="pmp-press"
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: hardware.radius,
                border: `1px solid ${ink || neons.cyan}`,
                background: radio.lcdFace,
                boxShadow: `inset 0 1px 0 rgba(216,223,232,0.12), 0 0 16px ${neons.cyanGlow}`,
                fontFamily: fontMono,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0.2,
                textTransform: "uppercase",
                color: neons.phosphor,
                cursor: "pointer",
              }}
            >
              Play it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
