// Energy Shift transport controls — Rabbit (lift) / Turtle (ease off).
// First-class aluminum glass beside play/pause. Recommendation work stays in
// the background; the UI only dispatches increaseEnergy() / decreaseEnergy().

import React, { useEffect, useRef, useState } from "react";
import { color, glass, fontMono } from "../../theme";
import { useEnergyQueue } from "../../useEnergyQueue";

const PRESS_EASE = "cubic-bezier(0.34, 1.4, 0.64, 1)";
const LONG_PRESS_MS = 450;
const PILL_MS = 1500;
const CHIP_MS = 3200;

function haptic(pattern = 8) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* best-effort */ }
}

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
 * Tap = ±10 BPM · long-press = ±5 / ±10 / ±20.
 * showLabel: tiny Lift/Ease caption under the icon (Cover Stage).
 */
export function EnergyShiftButton({ direction = "up", size = 30, stopPropagation = true, showLabel = false }) {
  const up = direction === "up";
  const { increaseEnergy, decreaseEnergy, energyShift } = useEnergyQueue();
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showTip = (hovered || focused) && !menuOpen && !pressed && !showLabel;
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

  return (
    <span style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: showLabel ? 4 : 0 }}>
      <button
        type="button"
        aria-label={up ? "Energy shift — lift the pace of upcoming tracks" : "Energy shift — ease the pace of upcoming tracks"}
        aria-pressed={activeHere}
        title={up ? "Lift — next picks get livelier" : "Ease — next picks slow down"}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={(e) => { if (pressed) endPress(e, true); setHovered(false); }}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") setHovered(true); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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
          color: activeHere ? color.ink : color.muted,
          background: activeHere
            ? `linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.45) 100%)`
            : glass.fillStrong,
          border: `1px solid ${activeHere ? color.lineStrong : glass.border}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          boxShadow: hovered || activeHere
            ? `inset 0 1px 0 ${glass.highlight}, 0 0 0 3px rgba(26,29,36,0.06), 0 4px 14px rgba(26,29,36,0.12)`
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

      {showLabel && (
        <span aria-hidden="true" style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          fontFamily: fontMono,
          color: activeHere ? color.ink : color.faint,
          lineHeight: 1,
        }}>
          {up ? "Lift" : "Ease"}
        </span>
      )}

      {showTip && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            whiteSpace: "nowrap",
            padding: "6px 11px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.95)",
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 8px 22px rgba(26,29,36,0.14)`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
            color: color.ink,
            fontSize: 11.5,
            fontWeight: 650,
            letterSpacing: -0.1,
            pointerEvents: "none",
            zIndex: 40,
            animation: `energyPillIn 0.18s ${PRESS_EASE} both`,
          }}
        >
          Next picks
          <span style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: color.muted }}>
            {up ? "Lift" : "Ease"}
          </span>
        </span>
      )}

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
            minWidth: 118,
            padding: 4,
            borderRadius: 12,
            background: "rgba(255,255,255,0.95)",
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
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(26,29,36,0.05)"; }}
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
 * Persistent chrome chip when Energy Shift is steering upcoming picks.
 */
export function EnergyShiftModeChip({ style = null }) {
  const { energyShift } = useEnergyQueue();
  if (!energyShift?.active) return null;
  const up = energyShift.direction > 0;
  return (
    <div
      className="energy-mode-chip"
      role="status"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px",
        borderRadius: 980,
        background: "rgba(255,255,255,0.88)",
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 6px 18px rgba(26,29,36,0.1)`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        color: color.ink,
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: -0.1,
        animation: `energyModeIn 0.35s ${PRESS_EASE} both`,
        ...style,
      }}
    >
      <span aria-hidden="true" style={{
        width: 6, height: 6, borderRadius: "50%", background: color.ink,
        boxShadow: `0 0 0 3px ${color.accentSoft}`,
        animation: "breathe 1.6s ease-in-out infinite",
      }}/>
      <span style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: color.muted }}>
        {up ? "Lift" : "Ease"}
      </span>
      <span>next picks</span>
    </div>
  );
}

/**
 * Floating feedback above the player after an energy shift.
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
  const neutral = lastAction.direction === 0 || lastAction.bpmStep === 0;

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
          background: "rgba(255,255,255,0.94)",
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 10px 28px rgba(26,29,36,0.14)`,
          backdropFilter: glass.blur, WebkitBackdropFilter: glass.blur,
          color: color.ink, fontSize: 12.5, fontWeight: 650, letterSpacing: -0.1,
          animation: `energyPillLife ${PILL_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}>
          {neutral
            ? "Back to your usual pace"
            : up
              ? "Next picks get livelier\u2026"
              : "Next picks slow down\u2026"}
        </div>
      )}
      {chipVisible && !neutral && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 999,
          background: "rgba(26,29,36,0.06)",
          border: `1px solid ${glass.borderSoft}`,
          color: color.ink,
          fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: 0.3,
          fontVariantNumeric: "tabular-nums",
          animation: `energyPillIn 0.3s ${PRESS_EASE} both`,
        }}>
          <span aria-hidden="true">{up ? "\u2191" : "\u2193"}</span>
          {up ? "+" : "\u2212"}{Math.abs(lastAction.bpmStep)} BPM
        </div>
      )}
    </div>
  );
}

/** Dial icon — energy gauge with a center needle. */
function EnergyDialIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 16.2a7.2 7.2 0 0 1 13.6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 16.2V8.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.2" r="1.55" fill="currentColor" />
      <path d="M7.4 14.2h1.6M15 14.2h1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

/**
 * Single Energy Shift control — opens a centered slider popup (middle = neutral).
 * Lives on the right of the transport row.
 */
export function EnergyShiftControl({
  size = 40,
  stopPropagation = true,
  labeled = false,
}) {
  const { energyShift, setEnergyBias } = useEnergyQueue();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(0);
  const rootRef = useRef(null);

  const active = !!energyShift?.active;
  const bias = Math.round(energyShift?.bpmDelta || 0);

  useEffect(() => {
    if (open) setDraft(bias);
  }, [open, bias]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const apply = (raw) => {
    const next = Math.max(-20, Math.min(20, Math.round(Number(raw) || 0)));
    setDraft(next);
    haptic(next === 0 ? [6, 20, 6] : 8);
    setEnergyBias(next);
  };

  const tone =
    draft > 0 ? "Lift" : draft < 0 ? "Ease" : "Middle";

  return (
    <span
      ref={rootRef}
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: labeled ? 4 : 0,
      }}
    >
      <button
        type="button"
        aria-label="Energy shift"
        aria-expanded={open}
        aria-pressed={active}
        title="Energy shift — ease or lift upcoming picks"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        style={{
          width: labeled ? "auto" : size,
          height: labeled ? 40 : size,
          padding: labeled ? "0 12px 0 8px" : 0,
          gap: labeled ? 8 : 0,
          borderRadius: labeled ? 12 : "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: active || open ? color.ink : color.muted,
          background: active || open
            ? `linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.48) 100%)`
            : glass.fillStrong,
          border: `1px solid ${active || open ? color.lineStrong : glass.border}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          boxShadow: hovered || active || open
            ? `inset 0 1px 0 ${glass.highlight}, 0 0 0 3px rgba(26,29,36,0.06), 0 4px 14px rgba(26,29,36,0.12)`
            : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: `transform 0.28s ${PRESS_EASE}, box-shadow 0.35s ease, color 0.2s ease, border-color 0.2s ease`,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          flexShrink: 0,
        }}
      >
        <EnergyDialIcon size={Math.round((labeled ? 40 : size) * 0.46)} />
        {labeled && (
          <span style={{
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            lineHeight: 1,
          }}>
            Shift
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Energy shift"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            right: 0,
            width: 220,
            padding: "14px 14px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 16px 36px rgba(26,29,36,0.16)`,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            animation: `energyMenuIn 0.24s ${PRESS_EASE} both`,
            zIndex: 50,
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: color.faint,
            }}>
              Energy shift
            </div>
            <div style={{
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: color.ink,
              fontVariantNumeric: "tabular-nums",
            }}>
              {draft === 0 ? "0" : `${draft > 0 ? "+" : "\u2212"}${Math.abs(draft)}`} BPM
            </div>
          </div>

          <input
            type="range"
            min={-20}
            max={20}
            step={5}
            value={draft}
            aria-valuemin={-20}
            aria-valuemax={20}
            aria-valuenow={draft}
            aria-valuetext={`${tone}, ${draft === 0 ? "middle" : `${Math.abs(draft)} BPM ${draft > 0 ? "lift" : "ease"}`}`}
            onChange={(e) => apply(e.target.value)}
            style={{
              width: "100%",
              accentColor: color.ink,
              cursor: "pointer",
              margin: 0,
            }}
          />

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: color.faint,
          }}>
            <span>Ease</span>
            <span style={{ color: draft === 0 ? color.ink : color.faint }}>Middle</span>
            <span>Lift</span>
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Secondary pace control — tucked above primary transport so the ice orb stays the jewel.
 */
export function EnergyShiftCapsule({ stopPropagation = false }) {
  return (
    <div
      role="group"
      aria-label="Pace — ease or lift upcoming picks"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.55)",
        border: `1px solid ${glass.borderSoft}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      <EnergyShiftButton direction="down" size={30} stopPropagation={stopPropagation} />
      <span
        aria-hidden="true"
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          fontFamily: fontMono,
          color: color.faint,
          padding: "0 2px",
          userSelect: "none",
        }}
      >
        Pace
      </span>
      <EnergyShiftButton direction="up" size={30} stopPropagation={stopPropagation} />
    </div>
  );
}
