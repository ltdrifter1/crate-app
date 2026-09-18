// Pace transport — Ease / Middle / Lift slider on the device.
// First-class aluminum glass beside play/pause. Recommendation work stays in
// the background; the UI only dispatches increaseEnergy() / decreaseEnergy().

import React, { useEffect, useRef, useState } from "react";
import { color, glass, fontMono, hardware, hardwareKey, motion, radio } from "../../theme";
import { useEnergyQueue } from "../../useEnergyQueue";
import FlaskMark from "./FlaskMark";

const PRESS_EASE = motion.ease;
const LONG_PRESS_MS = 450;
const PILL_MS = 1500;
const CHIP_MS = 3200;

function haptic(pattern = 8) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) { /* best-effort */ }
}

/** Three-bar ramp: descending = Ease, ascending = Lift. */
function PaceRampIcon({ size = 15, lift = false }) {
  const heights = lift ? [7, 11.5, 16] : [16, 11.5, 7];
  const xs = [5.5, 12, 18.5];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {xs.map((x, i) => (
        <rect
          key={i}
          x={x - 1.65}
          y={19.2 - heights[i]}
          width={3.3}
          height={heights[i]}
          rx={1.15}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/**
 * One pace paddle. direction: "up" (Lift) | "down" (Ease).
 * Tap = ±10 BPM on upcoming picks · long-press = ±5 / ±10 / ±20.
 * showLabel: Ease / Lift under the key.
 */
export function EnergyShiftButton({
  direction = "up",
  size = 44,
  stopPropagation = true,
  showLabel = false,
}) {
  const up = direction === "up";
  const verb = up ? "Lift" : "Ease";
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
        aria-label={up ? "Lift upcoming tracks" : "Ease upcoming tracks"}
        aria-pressed={activeHere}
        title={up ? "Lift upcoming picks" : "Ease upcoming picks"}
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
          ...hardwareKey({ pressed: pressed || activeHere, size: "md" }),
          width: size,
          height: size,
          minHeight: size,
          padding: 0,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: activeHere ? color.accent : color.ink,
          border: `1px solid ${activeHere ? color.accentGlow : "rgba(91,101,116,0.14)"}`,
          boxShadow: activeHere
            ? `${hardware.keyPressed}, 0 0 0 2px ${color.accentSoft}`
            : hovered
              ? `${hardware.keyRaised}, 0 0 0 2px ${color.accentSoft}`
              : hardware.keyRaised,
          transform: pressed ? "translateY(1px)" : "none",
          transition: `transform ${motion.fast} ${PRESS_EASE}, box-shadow ${motion.base} ${PRESS_EASE}, color ${motion.fast}`,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          flexShrink: 0,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <PaceRampIcon size={Math.round(size * 0.5)} lift={up} />
      </button>

      {showLabel && (
        <span aria-hidden="true" style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.16,
          textTransform: "uppercase",
          fontFamily: fontMono,
          color: activeHere ? color.accent : color.muted,
          lineHeight: 1.1,
          textAlign: "center",
        }}>
          {verb}
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
            borderRadius: 8,
            background: radio.moduleFace,
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 8px 22px rgba(58,66,80,0.22)`,
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
          Upcoming
          <span style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: color.muted }}>
            {verb}
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
            minWidth: 148,
            padding: 4,
            borderRadius: 8,
            background: radio.moduleFace,
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 14px 34px rgba(58,66,80,0.22)`,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            animation: `energyMenuIn 0.24s ${PRESS_EASE} both`,
            zIndex: 40,
          }}
        >
          {[
            { step: 5, word: up ? "Lift a little" : "Ease a little" },
            { step: 10, word: verb },
            { step: 20, word: up ? "Lift more" : "Ease more" },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              role="menuitem"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); dispatch(item.step); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "9px 12px", background: "none", border: "none", borderRadius: 8,
                cursor: "pointer", color: color.ink, fontSize: 12.5, fontWeight: 650,
                fontVariantNumeric: "tabular-nums",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(216,223,232,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <span>{item.word}</span>
              <span style={{ fontFamily: fontMono, fontSize: 11, color: color.muted }}>
                {up ? "+" : "\u2212"}{item.step}
              </span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

/** Bookend paddles for the device transport row. */
export function EnergyShiftPaddles({
  size = 44,
  stopPropagation = true,
  showLabel = false,
  gap = 0,
}) {
  return (
    <div
      role="group"
      aria-label="Pace — Ease or Lift upcoming tracks"
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: gap || (showLabel ? 8 : 6),
        flexShrink: 0,
      }}
    >
      <EnergyShiftButton
        direction="down"
        size={size}
        stopPropagation={stopPropagation}
        showLabel={showLabel}
      />
      <EnergyShiftButton
        direction="up"
        size={size}
        stopPropagation={stopPropagation}
        showLabel={showLabel}
      />
    </div>
  );
}

/**
 * Persistent chrome chip when Pace is steering upcoming picks.
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
        borderRadius: 8,
        background: radio.moduleFace,
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 6px 18px rgba(58,66,80,0.18)`,
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
      <span>upcoming</span>
    </div>
  );
}

/**
 * Floating feedback above the player after a pace nudge.
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
          padding: "8px 15px", borderRadius: 8,
          background: "rgba(168,178,192,0.94)",
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 10px 28px rgba(58,66,80,0.4)`,
          backdropFilter: glass.blur, WebkitBackdropFilter: glass.blur,
          color: color.ink, fontSize: 12.5, fontWeight: 650, letterSpacing: -0.1,
          animation: `energyPillLife ${PILL_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        }}>
          {neutral
            ? "Back to your usual pace"
            : up
              ? "Upcoming tracks lift"
              : "Upcoming tracks ease off"}
        </div>
      )}
      {chipVisible && !neutral && (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 8,
          background: "rgba(216,223,232,0.06)",
          border: `1px solid ${glass.borderSoft}`,
          color: color.ink,
          fontSize: 10.5, fontWeight: 700, fontFamily: fontMono, letterSpacing: 0.3,
          fontVariantNumeric: "tabular-nums",
          animation: `energyPillIn 0.3s ${PRESS_EASE} both`,
        }}>
          <span aria-hidden="true">{up ? "\u2191" : "\u2193"}</span>
          {up ? "+" : "\u2212"}{Math.abs(lastAction.bpmStep)}
        </div>
      )}
    </div>
  );
}

/**
 * Unused flask slider — paddles are the product control. Kept so older
 * call sites do not break if reintroduced; do not wire this to transport.
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
        className={`flask-taste-btn energy-shift-flask${active || open ? " is-active" : ""}${labeled ? " is-labeled" : ""}`}
        aria-label="Pace — ease or lift upcoming picks"
        aria-expanded={open}
        aria-pressed={active}
        title="Pace — ease or lift upcoming picks"
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        style={{
          ...hardwareKey({ pressed: active || open, size: "md" }),
          width: labeled ? "auto" : size,
          height: labeled ? 40 : size,
          minHeight: labeled ? 40 : size,
          padding: labeled ? "0 12px 0 8px" : 0,
          gap: labeled ? 8 : 0,
          borderRadius: labeled ? 10 : 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: active || open ? color.ink : color.muted,
          boxShadow: active || open
            ? hardware.keyPressed
            : hovered
              ? `${hardware.keyRaised}, 0 0 0 2px rgba(216,223,232,0.08)`
              : hardware.keyRaised,
          transform: hovered ? "scale(1.04)" : "scale(1)",
          transition: `transform 0.28s ${PRESS_EASE}, box-shadow 0.35s ease, color 0.2s ease, border-color 0.2s ease`,
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          flexShrink: 0,
        }}
      >
        <span className="flask-taste-mark" aria-hidden="true" style={{ display: "flex" }}>
          <FlaskMark
            size={Math.round((labeled ? 40 : size) * 0.58)}
            fillLevel={(bias + 20) / 40}
            active={active || open}
          />
        </span>
        {labeled && (
          <span style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            lineHeight: 1,
          }}>
            Pace
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pace"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            right: 0,
            width: 220,
            padding: "14px 14px 12px",
            borderRadius: 14,
            background: "rgba(168,178,192,0.96)",
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 16px 36px rgba(58,66,80,0.45)`,
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
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: color.faint,
            }}>
              Pace
            </div>
            <div style={{
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: color.ink,
              fontVariantNumeric: "tabular-nums",
            }}>
              {draft === 0 ? "0" : `${draft > 0 ? "+" : "\u2212"}${Math.abs(draft)}`}
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
            aria-valuetext={`${tone}, ${draft === 0 ? "middle" : `${Math.abs(draft)} ${draft > 0 ? "lift" : "ease"}`}`}
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
            fontSize: 11,
            fontWeight: 800,
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
 * Inline Pace slider — Ease ↔ Lift. Replaces Turtle / Bunny paddles on the device.
 * Glass plate, ice fill from center, middle = neutral.
 */
export function PaceSlider({
  compact = false,
  stopPropagation = true,
  style = null,
}) {
  const { energyShift, setEnergyBias } = useEnergyQueue();
  const bias = Math.round(energyShift?.bpmDelta || 0);
  const clamped = Math.max(-20, Math.min(20, bias));
  const tone = clamped > 0 ? "Lift" : clamped < 0 ? "Ease" : "Middle";
  const fillPct = Math.abs(clamped) / 20 * 50;

  return (
    <div
      role="group"
      aria-label="Pace — ease or lift upcoming picks"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
      onPointerDown={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
      style={{
        width: "100%",
        padding: compact ? "8px 10px 6px" : "10px 12px 8px",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(216,223,232,0.42) 0%, rgba(200,208,218,0.22) 100%)",
        border: "1px solid rgba(216,223,232,0.45)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 22px rgba(58,66,80,0.12)`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: compact ? 4 : 6,
        }}
      >
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.1,
            textTransform: "uppercase",
            color: color.muted,
          }}
        >
          Pace
        </span>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.2,
            color: color.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clamped === 0 ? "Middle" : `${clamped > 0 ? "+" : "\u2212"}${Math.abs(clamped)} BPM`}
        </span>
      </div>
      <div style={{ position: "relative", height: compact ? 22 : 26 }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 4,
            marginTop: -2,
            borderRadius: 2,
            background: radio.lcdTrack,
            boxShadow: "inset 0 1px 2px rgba(58,66,80,0.35)",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: clamped < 0 ? `${50 - fillPct}%` : "50%",
              width: `${fillPct}%`,
              borderRadius: 2,
              background: radio.lcdFill,
              boxShadow: radio.lcdGlow,
            }}
          />
        </div>
        <input
          type="range"
          className="chrome-seek pace-range"
          min={-20}
          max={20}
          step={5}
          value={clamped}
          aria-valuemin={-20}
          aria-valuemax={20}
          aria-valuenow={clamped}
          aria-valuetext={`${tone}, ${clamped === 0 ? "middle" : `${Math.abs(clamped)} BPM ${clamped > 0 ? "lift" : "ease"}`}`}
          aria-label="Pace"
          onChange={(e) => {
            const next = Math.max(-20, Math.min(20, Math.round(Number(e.target.value) || 0)));
            setEnergyBias(
              next,
              next > 0 ? "Lift" : next < 0 ? "Ease" : "Middle"
            );
          }}
          style={{
            position: "relative",
            width: "100%",
            margin: 0,
            height: compact ? 22 : 26,
            background: "transparent",
            cursor: "pointer",
            zIndex: 1,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 2,
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: color.faint,
        }}
      >
        <span style={{ color: clamped < 0 ? color.ink : color.faint }}>Ease</span>
        <span style={{ color: clamped === 0 ? color.ink : color.faint }}>Middle</span>
        <span style={{ color: clamped > 0 ? color.ink : color.faint }}>Lift</span>
      </div>
    </div>
  );
}

/** Compact Pace pair with Ease / Lift paddles (not the primary device control). */
export function EnergyShiftCapsule({ stopPropagation = false }) {
  return (
    <div
      role="group"
      aria-label="Pace — Ease or Lift upcoming picks"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 8px",
        borderRadius: 8,
        background: "rgba(184,191,202,0.65)",
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
