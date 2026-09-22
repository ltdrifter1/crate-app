/**
 * LandingScreen — public pre-auth discovery experience.
 *
 * Shows before login: genre channels, chart teasers, live radio CTA, and
 * the full login/signup form scrolled below the fold. Visitors feel the
 * product before they commit to anything.
 */
import { useState, useEffect, useRef } from "react";
import {
  font, fontDisplay, fontMono, color, radius, glass,
  aluminumGradient, trim, y2k, radio as radioStyle,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, trimStroke,
} from "../../theme";
import { authErrorMessage } from "../../lib/phone";
import { BrandLockup } from "../brand/BrandGlyphs";
import BrandTagline from "../brand/BrandTagline";
import BetaBadge from "../billing/BetaLaunchNotice";
import { FeatureIcon } from "../ui/Icon";

// ─── Static discovery data ────────────────────────────────────────────────────

const CHANNELS = [
  { id: "techno",        label: "Techno",          color: "#2A333C", accent: "#5AA8B8" },
  { id: "drum-and-bass", label: "Drum & Bass",      color: "#2E2535", accent: "#C87ADB" },
  { id: "house",         label: "House",            color: "#26312A", accent: "#6DBF87" },
  { id: "y2k-dance",     label: "Y2K Dance",        color: "#352230", accent: "#E0314A" },
  { id: "downtempo",     label: "Downtempo",        color: "#1E2830", accent: "#6AA8C8" },
  { id: "shoegaze",      label: "Shoegaze",         color: "#2A2835", accent: "#9B8FD0" },
  { id: "punk",          label: "Punk",             color: "#332420", accent: "#E05830" },
  { id: "metal",         label: "Metal",            color: "#202428", accent: "#A0A8B4" },
];

const CHART_TEASERS = [
  { rank: 1,  title: "Drexciya",       artist: "Black Sea",          dir: "▲ 2" },
  { rank: 2,  title: "Autechre",       artist: "Tri Repetae",        dir: "▲ 5" },
  { rank: 3,  title: "Burial",         artist: "Untrue",             dir: "—" },
  { rank: 4,  title: "Aphex Twin",     artist: "Richard D. James",   dir: "▼ 1" },
  { rank: 5,  title: "The Prodigy",    artist: "Music for the Jilted Generation", dir: "▲ 8" },
];

const FEATURES = [
  { icon: "radio",     code: "CH.01", head: "Live Radio",  body: "Genre channels streaming 24/7." },
  { icon: "chart",     code: "CH.02", head: "Charts",      body: "Vote, request, and watch tracks climb." },
  { icon: "crate",     code: "CH.03", head: "Your Crate",  body: "Build a library that's actually yours." },
  { icon: "discovery", code: "CH.04", head: "Discovery",   body: "Dig through scenes, eras, and artists." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScanlineOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: `repeating-linear-gradient(
          to bottom,
          transparent 0px,
          transparent 3px,
          rgba(58,66,80,0.04) 3px,
          rgba(58,66,80,0.04) 4px
        )`,
        mixBlendMode: "multiply",
      }}
    />
  );
}

function NeonPulse({ color: c = "#5AA8B8", size = 120, style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${c}22 0%, transparent 70%)`,
        animation: "pmpNeonPulse 4s ease-in-out infinite",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

function ChannelPill({ ch }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        background: ch.color,
        border: `1px solid ${ch.accent}44`,
        boxShadow: `0 0 18px ${ch.accent}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ch.accent,
          boxShadow: `0 0 6px ${ch.accent}`,
          animation: "pmpLcdPip 1.8s ease-in-out infinite",
          animationDelay: `${Math.random() * 1.5}s`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: fontDisplay,
          color: ch.accent,
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
        }}
      >
        {ch.label}
      </span>
    </div>
  );
}

function ChartRow({ rank, title, artist, dir }) {
  const up = dir.startsWith("▲");
  const flat = dir === "—";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderBottom: "1px solid rgba(91,101,116,0.12)",
      }}
    >
      <span
        style={{
          width: 26,
          fontFamily: fontMono,
          fontSize: 12,
          fontWeight: 700,
          color: rank <= 3 ? trim.blue : color.muted,
          letterSpacing: 0.2,
          flexShrink: 0,
        }}
      >
        {String(rank).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: fontDisplay,
            color: color.ink,
            letterSpacing: -0.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: color.muted,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {artist}
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: fontMono,
          color: up ? "#6DBF87" : flat ? color.muted : "#E0314A",
          flexShrink: 0,
        }}
      >
        {dir}
      </span>
    </div>
  );
}

function FeatureRow({ icon, code, head, body, last }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "13px 14px",
        borderBottom: last ? "none" : "1px solid rgba(91,101,116,0.12)",
      }}
    >
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.2,
          color: trim.blue,
          paddingTop: 3,
          flexShrink: 0,
          width: 34,
        }}
      >
        {code}
      </span>
      <span style={{ color: color.lcdSignal, display: "flex", flexShrink: 0, paddingTop: 1 }}>
        <FeatureIcon name={icon} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: fontDisplay,
            color: color.ink,
            letterSpacing: -0.1,
          }}
        >
          {head}
        </div>
        <div style={{ fontSize: 12, color: color.muted, lineHeight: 1.4, marginTop: 1 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingScreen({
  onSignUp,
  onLogIn,
  onGoogleSignIn,
  onResetPassword,
  authError = null,
  onClearAuthError,
}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

  const displayError = error || (authError ? authErrorMessage(authError) : "");

  function reset() {
    setError("");
    setNotice("");
    onClearAuthError?.();
  }

  async function handleGoogle() {
    reset();
    setLoading(true);
    setNotice("Connecting to Google…");
    try {
      const user = await onGoogleSignIn();
      if (user == null) {
        setNotice("Redirecting to Google…");
        return;
      }
      setNotice("");
    } catch (e) {
      setNotice("");
      if (e?.code !== "auth/popup-closed-by-user") {
        setError(authErrorMessage(e, "Google sign-in failed."));
      }
    }
    setLoading(false);
  }

  async function handleForgot() {
    if (!email.trim()) { setError("Enter your email first."); return; }
    reset();
    setLoading(true);
    try {
      await onResetPassword(email.trim());
      setNotice("Password reset email sent.");
    } catch (e) {
      setError(authErrorMessage(e, "Couldn't send reset email."));
    }
    setLoading(false);
  }

  async function handleSubmit() {
    reset();
    if (mode === "signup") {
      if (!name.trim()) { setError("Choose a display name."); return; }
      if (!email.trim()) { setError("Enter an email address."); return; }
      if (pass.length < 6) { setError("Password must be at least 6 characters."); return; }
      if (pass !== pass2) { setError("Passwords don't match."); return; }
    } else if (!email.trim() || !pass) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await onSignUp(email.trim(), pass, name.trim());
      } else {
        await onLogIn(email.trim(), pass);
      }
    } catch (e) {
      setError(authErrorMessage(e));
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: aluminumGradient(),
        fontFamily: font,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <ScanlineOverlay />

      {/* Ambient neon blooms */}
      <NeonPulse color="#5AA8B8" size={360} style={{ top: "5%", left: "-8%", opacity: 0.6 }} />
      <NeonPulse color="#C87ADB" size={280} style={{ top: "18%", right: "-4%", opacity: 0.4 }} />
      <NeonPulse color="#E0314A" size={200} style={{ bottom: "30%", left: "60%", opacity: 0.3 }} />

      <style>{`
        @keyframes pmpNeonPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.18); opacity: 1; }
        }
        @keyframes pmpChannelScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .pmp-channel-rail-inner {
          display: flex;
          gap: 10px;
          animation: pmpChannelScroll 28s linear infinite;
          width: max-content;
        }
        .pmp-channel-rail-inner:hover { animation-play-state: paused; }
        @keyframes stationIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "48px 20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 16,
          animation: "stationIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div style={{ width: "min(68vw, 240px)" }}>
          <BrandLockup size={240} />
        </div>
        <BrandTagline
          size={12}
          style={{ color: color.muted, letterSpacing: 0.2 }}
        />
        <BetaBadge />

        {/* Hero statement */}
        <div style={{ maxWidth: 420, marginTop: 8 }}>
          <h1
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(26px, 7vw, 38px)",
              fontWeight: 800,
              letterSpacing: -0.9,
              color: color.ink,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Music should feel like something you discover.
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              color: color.muted,
              lineHeight: 1.55,
              fontWeight: 450,
            }}
          >
            Channels, charts, radio, crates — your world, your music.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setMode("signup");
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            }}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Start for free
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            }}
            style={{
              padding: "14px 28px",
              borderRadius: 10,
              border: "1px solid rgba(91,101,116,0.28)",
              background: "rgba(208,214,224,0.22)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: fontDisplay,
              color: color.ink,
              cursor: "pointer",
            }}
          >
            Log in
          </button>
        </div>
      </div>

      {/* ── LIVE CHANNELS RAIL ────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 40,
          overflow: "hidden",
        }}
      >
        {/* LCD header */}
        <div
          style={{
            margin: "0 20px 12px",
            padding: "7px 14px",
            borderRadius: 8,
            background: radioStyle.lcdFace,
            border: radioStyle.lcdBorder,
            boxShadow: radioStyle.lcdShadow,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.16,
            textTransform: "uppercase",
            color: "#B7E4EE",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="pmp-lcd-pip" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#E0314A", flexShrink: 0 }} />
          Live Channels — Streaming Now
        </div>

        {/* Infinite scroll rail */}
        <div style={{ overflow: "hidden", padding: "4px 0 8px" }}>
          <div className="pmp-channel-rail-inner" style={{ paddingLeft: 20 }}>
            {[...CHANNELS, ...CHANNELS].map((ch, i) => (
              <ChannelPill key={`${ch.id}-${i}`} ch={ch} />
            ))}
          </div>
        </div>
      </div>

      {/* ── CHARTS TEASER ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, margin: "32px 20px 0" }}>
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            background: radioStyle.moduleFace,
            border: "1px solid rgba(91,101,116,0.18)",
            boxShadow: "inset 0 1px 0 rgba(216,223,232,0.45), 0 12px 32px rgba(58,66,80,0.18)",
          }}
        >
          {/* Board header */}
          <div
            style={{
              padding: "12px 14px",
              background: radioStyle.lcdFace,
              borderBottom: radioStyle.lcdBorder,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pmp-lcd-pip" style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0314A", display: "inline-block" }} />
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.16,
                  textTransform: "uppercase",
                  color: "#B7E4EE",
                }}
              >
                This Month's Chart · Top 5
              </span>
            </div>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 9,
                color: "#5AA8B8",
                letterSpacing: 0.1,
              }}
            >
              REQUEST TO CLIMB ↑
            </span>
          </div>

          {/* Chart rows */}
          {CHART_TEASERS.map((row) => (
            <ChartRow key={row.rank} {...row} />
          ))}

          {/* CTA row */}
          <div
            style={{
              padding: "12px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: trim.blue,
              fontFamily: fontDisplay,
              letterSpacing: -0.1,
              borderTop: "1px solid rgba(91,101,116,0.12)",
              textAlign: "center",
            }}
          >
            Sign up to vote, request, and see the full board →
          </div>
        </div>
      </div>

      {/* ── LINER NOTES ───────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, margin: "32px 20px 0" }}>
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            background: radioStyle.moduleFace,
            border: "1px solid rgba(91,101,116,0.18)",
            boxShadow: "inset 0 1px 0 rgba(216,223,232,0.45), 0 12px 32px rgba(58,66,80,0.18)",
          }}
        >
          <div
            style={{
              padding: "12px 14px",
              background: radioStyle.lcdFace,
              borderBottom: radioStyle.lcdBorder,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="pmp-lcd-pip" style={{ width: 6, height: 6, borderRadius: "50%", background: "#5AA8B8", display: "inline-block" }} />
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.16,
                textTransform: "uppercase",
                color: "#B7E4EE",
              }}
            >
              Liner Notes — What's On This Disc
            </span>
          </div>
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.head} {...f} last={i === FEATURES.length - 1} />
          ))}
        </div>
      </div>

      {/* ── AUTH FORM ─────────────────────────────────────────────────────── */}
      <div
        ref={formRef}
        style={{
          position: "relative",
          zIndex: 1,
          margin: "40px 20px 60px",
          padding: "22px 20px 20px",
          background: "rgba(74,83,96,0.86)",
          border: "1px solid rgba(91,101,116,0.12)",
          borderRadius: 14,
          boxShadow: "inset 0 1px 0 rgba(216,223,232,0.08), 0 16px 44px rgba(58,66,80,0.4)",
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Google */}
        <button
          type="button"
          className="btn-primary"
          onClick={handleGoogle}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "14px 20px",
            borderRadius: 10,
            ...trimStroke("linear-gradient(180deg, #F4F7FA 0%, #E4EAF1 100%)", 2),
            boxShadow: "0 1px 0 rgba(28,32,40,0.22), 0 4px 16px rgba(58,66,80,0.18)",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <GoogleMark />
          <span style={{ fontSize: 16, fontWeight: 600, color: color.ink }}>
            {loading && notice?.includes("Google") ? "Connecting…" : "Continue with Google"}
          </span>
        </button>

        {(displayError || notice) && (
          <div
            role={displayError ? "alert" : "status"}
            style={{
              fontSize: 13,
              color: displayError ? color.alert : color.body,
              background: displayError ? "rgba(30,34,40,0.08)" : color.canvas,
              border: `1px solid ${displayError ? color.lineStrong : color.line}`,
              borderRadius: radius.md,
              padding: "12px 14px",
              lineHeight: 1.45,
            }}
          >
            {displayError || notice}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(91,101,116,0.22)" }} />
          <span style={{ fontSize: 12, color: color.faint, letterSpacing: 0.2 }}>or email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(91,101,116,0.22)" }} />
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 16, borderBottom: "1px solid rgba(91,101,116,0.22)" }}>
          {[{ id: "login", label: "Log in" }, { id: "signup", label: "Create account" }].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setMode(m.id); reset(); setPass2(""); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 0 10px",
                fontSize: 14,
                fontWeight: mode === m.id ? 700 : 500,
                fontFamily: fontDisplay,
                letterSpacing: -0.2,
                color: mode === m.id ? color.ink : color.faint,
                borderBottom: mode === m.id ? `2px solid ${trim.blue}` : "2px solid transparent",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <input
            placeholder="Display name"
            aria-label="Display name"
            autoComplete="nickname"
            style={INPUT_ST}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          aria-label="Email"
          autoComplete="email"
          style={INPUT_ST}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div style={{ position: "relative" }}>
          <input
            placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
            type={showPass ? "text" : "password"}
            aria-label="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={{ ...INPUT_ST, paddingRight: 72 }}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleSubmit()}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: color.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>
        {mode === "signup" && (
          <input
            placeholder="Confirm password"
            type={showPass ? "text" : "password"}
            aria-label="Confirm password"
            autoComplete="new-password"
            style={INPUT_ST}
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        )}
        {mode === "login" && (
          <button
            type="button"
            onClick={handleForgot}
            disabled={loading}
            style={{
              alignSelf: "flex-end",
              marginTop: -4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: color.muted,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Forgot password?
          </button>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in with email" : "Create account"}
        </button>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77.01-.53z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
