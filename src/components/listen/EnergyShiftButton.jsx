// Energy Shift transport controls — Rabbit (lift) / Turtle (ease off).
// First-class glass controls beside play/pause. All the recommendation work
// stays in the background (playerEnergyStore + EnergyRecommendationEngine);
// the UI only dispatches increaseEnergy() / decreaseEnergy() and shows a
// short-lived explanation pill + trend chip.

import React, { useEffect, useRef, useState } from "react";
import { color, glass, fontMono } from "../../theme";
import { useEnergyQueue } from "../../useEnergyQueue";

const PRESS_EASE = "cubic-bezier(0.34, 1.4, 0.64, 1)"; // gentle spring, no rubber
const LONG_PRESS_MS = 450;
const PILL_MS = 1500;
const CHIP_MS = 3200;

function haptic(pattern = 8) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* haptics are best-effort */ }
}

/** Minimal monochrome rabbit — two ears + body, stroke only. */
function RabbitIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 10.5C8.6 7.4 8.2 4.4 9.4 3.6c1.2-.8 2.6 1.6 3.2 4.6" />
      <path d="M13.6 9.8c-.3-3.2.1-6.1 1.5-6.5 1.4-.4 2.2 2.3 2.2 5.4" />
      <path d="M6.5 16.2c0-3.4 2.7-5.8 6-5.8 3.4 0 6 2.4 6 5.5 0 2.6-2.1 4.4-5.4 4.6l-6.9.3c-1.5.1-2.4-.7-2.4-1.7 0-.9.7-1.6 1.7-1.8" />
      <circle cx="15.9" cy="14.6" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Minimal monochrome turtle — shell + head, stroke only. */
function TurtleIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 15.5c0-3.6 3-6.5 6.7-6.5s6.6 2.9 6.6 6.5" />
      <path d="M3.5 15.5h17" />
      <path d="M20.5 15.5c1 0 1.8-.8 1.8-1.8 0-.9-.7-1.7-1.7-1.7-.5 0-1 .2-1.3.6" />
      <path d="M6.5 15.5l-1 3M17 15.5l1 3M11.7 9v6.5M8.2 11l1.6 4.5M15.2 11l-1.6 4.5" />
    </svg>
  );
}

/**
 * One energy-shift control. direction: "up" (rabbit) | "down" (turtle).
 * Tap = ±10 BPM nudge · long-press = ±5 / ±10 / ±20 menu.
 */
export function EnergyShiftButton({ direction = "up", size = 30, stopPropagation = true }) {
  const up = direction === "up";
  const { increaseEnergy, decreaseEnergy, energyShift } = useEnergyQueue();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressRef = useRef(null);
  const firedLongPress = useRef(false);

  const activeHere = energyShift.active && energyShift.direction === (up ? 1 : -1);

  const dispatch = (bpmStep) => {
    haptic(up ? 8 : [6, 30, 6]);
    if (up) increaseEnergy(bpmStep); else decreaseEnergy(bpmStep);
  };

  const startPress = (e) => {
    if (stopPropagation) e.stopPropagation();
    setPressed(true);
    firedLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      firedLongPress.current = true;
      haptic(14);
      setMenuOpen(true);
    }, LONG_PRESS_MS);
  };

  const endPress = (e, cancelled = false) => {
    if (stopPropagation) e.stopPropagation();
    setPressed(false);
    clearTimeout(longPressRef.current);
    if (!cancelled && !firedLongPress.current) dispatch(10);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  useEffect(() => () => clearTimeout(longPressRef.current), []);

  const glow = up ? "rgba(10,124,255,0.28)" : "rgba(108,92,231,0.26)";

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label={up ? "Increase energy" : "Decrease energy"}
        aria-pressed={activeHere}
        title={up ? "Pick up the pace" : "Slow things down"}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={(e) => { if (pressed) endPress(e, true); setHovered(false); }}
        onPointerEnter={() => setHovered(true)}
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => { if (stopPropagation) e.stopPropagation(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dispatch(10); } }}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: activeHere ? color.accent : color.muted,
          background: glass.fillStrong,
          border: `1px solid ${activeHere ? "rgba(10,124,255,0.35)" : glass.border}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          boxShadow: hovered || activeHere
            ? `inset 0 1px 0 ${glass.highlight}, 0 0 0 4px ${up ? color.accentSoft : "rgba(108,92,231,0.10)"}, 0 4px 14px ${glow}`
            : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
          transform: pressed ? "scale(0.88)" : hovered ? "scale(1.06)" : "scale(1)",
          transition: `transform 0.28s ${PRESS_EASE}, box-shadow 0.35s ease, color 0.2s ease, border-color 0.2s ease`,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          padding: 0,
          flexShrink: 0,
        }}
      >
        {up ? <RabbitIcon size={Math.round(size * 0.52)} /> : <TurtleIcon size={Math.round(size * 0.52)} />}
      </button>

      {menuOpen && (
        <div
          role="menu"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            minWidth: 108,
            padding: 4,
            borderRadius: 12,
            background: "rgba(255,255,255,0.94)",
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 14px 34px rgba(26,29,36,0.16)`,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            animation: `energyMenuIn 0.24s ${PRESS_EASE} both`,
            zIndex: 40,
          }}
        >
          {[5, 10, 20].map((step) => (
            <button
              key={step}
              type="button"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); dispatch(step); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "9px 12px", background: "none", border: "none", borderRadius: 8,
                cursor: "pointer", color: color.ink, fontSize: 12.5, fontWeight: 650,
                fontVariantNumeric: "tabular-nums",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = color.accentSoft; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <span>{up ? "Lift" : "Ease"}</span>
              <span style={{ fontFamily: fontMono, fontSize: 11, color: color.muted }}>
                {up ? "+" : "\u2212"}{step} BPM
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

/**
 * Floating feedback above the player: a 1.5s explanation pill on press, and a
 * small trend chip (↑ +10 BPM) that lingers a moment while the sweep runs.
 * Render inside a positioned container (the dock / transport wrapper).
 */
export function EnergyShiftFeedback({ bottom = "calc(100% + 12px)" }) {
  const { energyShift } = useEnergyQueue();
  const { lastAction } = energyShift;
  const [pillVisible, setPillVisible] = useState(false);
  const [chipVisible, setChipVisible] = useState(false);

  useEffect(() => {
    if (!lastAction) return;
    setPillVisible(true);
    setChipVisible(true);
    const p = setTimeout(() => setPillVisible(false), PILL_MS);
    const c = setTimeout(() => setChipVisible(false), CHIP_MS);
    return () => { clearTimeout(p); clearTimeout(c); };
  }, [lastAction]);

  if (!lastAction || (!pillVisible && !chipVisible)) return null;
  const up = lastAction.direction > 0;

  return (
    <div aria-live="polite" style={{
      position: "absolute", left: 0, right: 0, bottom,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      pointerEvents: "none", zIndex: 30,
    }}>
      {pillVisible && (
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 15px", borderRadius: 999,
          background: "rgba(255,255,255,0.92)",
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 10px 28px rgba(26,29,36,0.14)`,
          backdropFilter: glass.blur, WebkitBackdropFilter: glass.blur,
          color: color.ink, fontSize: 12.5, fontWeight: 650, letterSpacing: -0.1,
          animation: `energyPillLife ${PILL_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}>
          <span aria-hidden="true" style={{ fontSize: 13 }}>{up ? "\u26A1" : "\uD83C\uDF19"}</span>
          {up ? "Picking up the pace\u2026" : "Slowing things down\u2026"}
        </div>
      )}
      {chipVisible && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 999,
          background: up ? color.accentSoft : "rgba(108,92,231,0.12)",
          border: `1px solid ${up ? "rgba(10,124,255,0.22)" : "rgba(108,92,231,0.22)"}`,
          color: up ? color.accent : "#6C5CE7",
          fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: 0.3,
          fontVariantNumeric: "tabular-nums",
          animation: `energyPillIn 0.3s ${PRESS_EASE} both`,
          transition: "opacity 0.5s ease",
        }}>
          <span aria-hidden="true">{up ? "\u2191" : "\u2193"}</span>
          {up ? "+" : "\u2212"}{Math.abs(lastAction.bpmStep)} BPM
        </div>
      )}
    </div>
  );
}
