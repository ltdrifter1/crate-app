import { useEffect } from "react";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  color,
  fontDisplay,
  fontMono,
  glass,
  motion,
  radius,
  y2k,
} from "../../theme";
import { formatChannelNum } from "../../lib/mtvChannel";
import CoverImage from "../ui/CoverImage";

/**
 * Home-load popup that features the showcase station (Local PNW).
 */
export default function ShowcasePromo({
  channel = null,
  open = false,
  onTune = null,
  onDismiss = null,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onDismiss?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open || !channel) return null;

  const title = channel.title || "Local Pacific Northwest";
  const ch = formatChannelNum(channel.num ?? 3);
  const photo = channel.art || null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="showcase-promo-title"
      className="pmp-showcase-promo"
      onClick={onDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(6, 8, 11, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: `stationBumperIn 0.32s ${motion.ease} both`,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(100%, 400px)",
          padding: 22,
          borderRadius: 28,
          background: `
            linear-gradient(165deg, rgba(42,47,55,0.92) 0%, rgba(20,24,30,0.88) 100%)
          `,
          border: `1px solid rgba(255,255,255,0.16)`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
          color: color.ink,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            marginBottom: 16,
            borderRadius: radius.pill,
            background: glass.chrome,
            border: `1px solid ${glass.border}`,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          Showcase · {ch}
        </div>

        {photo && (
          <CoverImage
            src={photo}
            alt=""
            width={356}
            height={200}
            priority
            objectPosition={channel.artFocus || "center 40%"}
            style={{
              width: "100%",
              height: 168,
              objectFit: "cover",
              borderRadius: 16,
              marginBottom: 16,
              boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
            }}
          />
        )}

        <div
          id="showcase-promo-title"
          style={{
            fontFamily: fontDisplay,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.4,
            lineHeight: 1.15,
            color: y2k.offWhite,
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: color.muted, lineHeight: 1.45, marginBottom: 18 }}>
          {channel.tagline || "Pacific Northwest only — on the air now."}
        </div>

        <button
          type="button"
          onClick={() => onTune?.(channel)}
          style={{ ...BTN_PRIMARY, marginBottom: 10 }}
        >
          Tune in
        </button>
        <button type="button" onClick={onDismiss} style={BTN_SECONDARY}>
          Not now
        </button>
      </div>
    </div>
  );
}
