import {
  chrome, color, dock, font, glass, homeSpace, motion, radius,
} from "../../theme";
import { hexToRgbStr } from "../../lib/harmony";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";

export function ScreenPane({ children }) {
  return (
    <div
      style={{
        minHeight: "100%",
        animation: `screenIn 0.38s ${motion.ease} both`,
      }}
    >
      {children}
    </div>
  );
}

export function contentPadBottom(hasPlayer) {
  const base = hasPlayer ? dock.clearPlayer : dock.clearTabs;
  return `calc(${base}px + env(safe-area-inset-bottom, 0px))`;
}

export function AmbientNetworkPill({ isOffline }) {
  const isBuffering = useIsBuffering();
  const isPlaying = useIsPlaying();
  if (!(isOffline || (isBuffering && isPlaying))) return null;
  return (
    <div role="status" style={{
      position: "fixed",
      top: `calc(10px + env(safe-area-inset-top, 0px))`,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 120,
      display: "flex", alignItems: "center", gap: 8,
      background: isOffline ? color.canvasEdge : color.surfaceRaised,
      color: isOffline ? color.ink : color.body,
      border: `1px solid ${glass.border}`,
      borderRadius: 8,
      padding: "7px 14px",
      fontSize: 12.5, fontWeight: 600,
      boxShadow: glass.shadowSoft,
      animation: "rise 0.3s cubic-bezier(0.22,1,0.36,1) both",
      pointerEvents: "none",
    }}>
      <span aria-hidden="true" style={{
        width: 7, height: 7, borderRadius: "50%",
        background: isOffline ? color.alert : color.accent,
        animation: isOffline ? "none" : "breathe 1.4s ease-in-out infinite",
      }}/>
      {isOffline ? "You're offline — playback may stall" : "Buffering…"}
    </div>
  );
}

export function CatalogSkeleton() {
  const tile = homeSpace.tile;
  const bone = (opts) => ({
    background: opts.strong
      ? "rgba(91,101,116,0.12)"
      : opts.mid
        ? "rgba(91,101,116,0.08)"
        : "rgba(91,101,116,0.05)",
    animation: "shimmer 1.5s ease-in-out infinite",
    animationDelay: opts.delay || "0s",
  });
  const shelf = (key) => (
    <div key={key} style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
      <div style={{
        width: 140, height: 14, borderRadius: 4, marginBottom: 18,
        ...bone({ mid: true }),
      }}/>
      <div style={{ display: "flex", gap: homeSpace.shelfGap, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ flex: "0 0 auto", width: tile }}>
            <div style={{
              width: tile, height: tile, borderRadius: radius.md,
              border: `1px solid ${glass.borderFaint}`,
              ...bone({ mid: true, delay: `${i * 0.08}s` }),
            }}/>
            <div style={{
              width: tile * 0.8, height: 11, borderRadius: 4, marginTop: 12,
              ...bone({ delay: `${i * 0.08}s` }),
            }}/>
            <div style={{
              width: tile * 0.55, height: 9, borderRadius: 4, marginTop: 7,
              ...bone({ delay: `${i * 0.08}s` }),
            }}/>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ paddingTop: 32, animation: "fadeIn 0.3s ease both" }}>
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: chrome.signal,
            boxShadow: `0 0 10px rgba(${chrome.cyanRgb},0.45)`,
            animation: "breathe 1.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: font,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.08,
            color: color.muted,
          }}
        >
          Loading…
        </span>
      </div>
      <div aria-hidden="true" style={{ padding: `0 ${homeSpace.gutter}px`, marginBottom: 36 }}>
        <div style={{
          width: "100%", maxWidth: 420, height: 200, borderRadius: radius.xl,
          border: `1px solid ${glass.borderFaint}`,
          ...bone({ strong: true }),
        }}/>
      </div>
      {shelf("a")}
      {shelf("b")}
    </div>
  );
}

export function Pulse({ track }) {
  useIsPlaying();
  return null;
}

export function BgMist({ color: mistColor = "#909090" }) {
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{
        position:"absolute", top:"-10%", left:"30%", width:280, height:280, borderRadius:"50%",
        background:`radial-gradient(circle,rgba(${hexToRgbStr(mistColor)},0.045) 0%,transparent 70%)`,
        filter:"blur(40px)",
      }}/>
    </div>
  );
}

export function ToastEl({ msg, onDismiss = null }) {
  return (
    <div role="status" onClick={onDismiss || undefined} style={{
      position:"fixed",
      bottom: `calc(${dock.clearPlayer + 16}px + env(safe-area-inset-bottom, 0px))`,
      left:"50%", transform:"translateX(-50%)",
      background: color.surfaceRaised, color: color.ink, padding:"10px 18px", borderRadius: radius.md,
      fontSize:13, zIndex:200, whiteSpace:"nowrap", fontWeight:550,
      border:`1px solid ${color.lineStrong}`, boxShadow:"0 12px 32px rgba(58,66,80,0.4)",
      cursor: onDismiss ? "pointer" : "default",
      animation: "rise 0.25s cubic-bezier(0.22,1,0.36,1) both",
    }}>{msg}</div>
  );
}
