/**
 * LandingScreen — public pre-auth discovery experience.
 *
 * Shows before login: genre channels, chart teasers, live radio CTA, and
 * the full login/signup form scrolled below the fold. Visitors feel the
 * product before they commit to anything.
 */
import { useState, useEffect, useRef } from "react";
import {
  font, fontDisplay, fontMono, fontPoster, color, radius, glass, mtv,
  radio as radioStyle,
  INPUT_ST, BTN_PRIMARY, BTN_SECONDARY, trimStroke,
} from "../../theme";
import { authErrorMessage } from "../../lib/phone";
import { BrandLockup } from "../brand/BrandGlyphs";
import BrandTagline from "../brand/BrandTagline";
import BetaBadge from "../billing/BetaLaunchNotice";
import { FeatureIcon } from "../ui/Icon";
import { SCENE_CHANNELS } from "../../lib/sceneChannels";
import { inkForTrack, NEUTRAL_INK } from "../../lib/board";
import { RankNumeral } from "../station/BoardParts";
import ChannelCard from "../home/ChannelCard";
import { Rail } from "../home/MusicSection";

// ─── Static discovery data ────────────────────────────────────────────────────

/** The front door shows the real dial — eight stations, their own art and ink. */
const DOOR_CHANNELS = SCENE_CHANNELS.slice(0, 8);

/**
 * Fallback board for when the catalog has not loaded yet. These are NOT the
 * live chart — the card says so ("Sample board") and shows no movement arrows,
 * because there is no week-over-week data behind them.
 */
const SAMPLE_CHART = [
  { rank: 1,  title: "Drexciya",       artist: "Black Sea",          dir: "" },
  { rank: 2,  title: "Autechre",       artist: "Tri Repetae",        dir: "" },
  { rank: 3,  title: "Burial",         artist: "Untrue",             dir: "" },
  { rank: 4,  title: "Aphex Twin",     artist: "Richard D. James",   dir: "" },
  { rank: 5,  title: "The Prodigy",    artist: "Music for the Jilted Generation", dir: "" },
];

/** station.js `deltaLabel` → what the teaser prints. Only claim what the data says. */
const CHART_DIR = { "↑ HOT": "▲ HOT", "↑": "▲", NEW: "NEW" };

/** Top 5 of the real countdown, or null if there are not enough tracks to be a board. */
export function liveChartRows(chart = []) {
  const rows = (Array.isArray(chart) ? chart : [])
    .filter((e) => e?.track?.title)
    .slice(0, 5)
    .map((e, i) => ({
      rank: e.rank || i + 1,
      title: e.track.title,
      artist: e.track.artist || "",
      dir: CHART_DIR[e.deltaLabel] || "",
      track: e.track,
    }));
  return rows.length >= 3 ? rows : null;
}

const FEATURES = [
  { icon: "radio",     code: "CH.01", head: "Live Radio",  body: "Genre channels streaming 24/7." },
  { icon: "chart",     code: "CH.02", head: "Charts",      body: "Vote, request, and watch tracks climb." },
  { icon: "crate",     code: "CH.03", head: "Your Crate",  body: "Build a library that's actually yours." },
  { icon: "discovery", code: "CH.04", head: "Discovery",   body: "Dig through scenes, eras, and artists." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartRow({ rank, title, artist, dir, track = null, last = false }) {
  const up = dir.startsWith("▲");
  const flat = !dir || dir === "—" || dir === "NEW";
  const ink = track ? inkForTrack(track) : NEUTRAL_INK;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "4px 40px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 12,
        padding: "9px 14px 9px 0",
        borderBottom: last ? "none" : "1px solid rgba(200,210,222,0.08)",
      }}
    >
      <span aria-hidden="true" style={{ width: 4, alignSelf: "stretch", background: ink, borderRadius: 1 }} />
      <span style={{ color: color.ink, display: "flex", justifyContent: "center" }}>
        <RankNumeral rank={rank} size={26} ink={ink} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontPoster,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.04,
            textTransform: "uppercase",
            lineHeight: 1.05,
            color: color.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
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
          fontSize: 11,
          fontWeight: 700,
          fontFamily: fontMono,
          color: up ? "#6DBF87" : flat ? color.muted : mtv.hot,
          flexShrink: 0,
        }}
      >
        {dir}
      </span>
    </div>
  );
}

/** Masthead strip over a card — the Board's voice: red square, condensed caps. */
function CardMast({ children, right = null, live = false }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(200,210,222,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span aria-hidden="true" style={{ width: 7, height: 7, background: live ? mtv.hot : color.faint, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: fontPoster,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: mtv.caps,
            textTransform: "uppercase",
            color: color.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {children}
        </span>
      </span>
      {right ? (
        <span style={{ fontFamily: fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", color: color.muted, flexShrink: 0 }}>
          {right}
        </span>
      ) : null}
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
        borderBottom: last ? "none" : "1px solid rgba(200,210,222,0.08)",
      }}
    >
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.2,
          color: color.muted,
          paddingTop: 3,
          flexShrink: 0,
          width: 34,
        }}
      >
        {code}
      </span>
      <span style={{ color: color.ink, display: "flex", flexShrink: 0, paddingTop: 1 }}>
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
  chart = [],
}) {
  const liveRows = liveChartRows(chart);
  const chartRows = liveRows || SAMPLE_CHART;
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
      className="pmp-landing"
      style={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: 1120,
        margin: "0 auto",
        background: color.canvas,
        fontFamily: font,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @keyframes stationIn {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: none; }
        }
        /* Beside the desktop source list the lockup is already on screen: print it once. */
        @media (min-width: 900px) {
          .pmp-landing-lockup { display: none !important; }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "40px 20px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 14,
          animation: "stationIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <div className="pmp-landing-lockup" style={{ width: "min(56vw, 200px)" }}>
          <BrandLockup size={200} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <BrandTagline
            size={12}
            style={{ color: color.muted, letterSpacing: 0.2 }}
          />
          <BetaBadge />
        </div>

        {/* Hero statement — the station's voice */}
        <div style={{ maxWidth: 560, marginTop: 4 }}>
          <h1
            style={{
              fontFamily: fontPoster,
              fontSize: "clamp(48px, 13vw, 96px)",
              fontWeight: 800,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              color: color.ink,
              lineHeight: 0.9,
              margin: 0,
            }}
          >
            Open all night.
          </h1>
          <p
            style={{
              marginTop: 14,
              fontSize: 15,
              color: color.body,
              lineHeight: 1.55,
              fontWeight: 450,
            }}
          >
            {`${SCENE_CHANNELS.length} live channels, a monthly chart, and a crate that's actually yours.`}
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
            Tune in free
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            }}
            style={{
              ...BTN_SECONDARY,
              width: "auto",
              padding: "14px 28px",
              fontSize: 15,
            }}
          >
            Log in
          </button>
        </div>
      </div>

      {/* ── THE DIAL ─────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, marginTop: 36 }}>
        <div
          style={{
            margin: "0 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden="true" className="pmp-live-dot" style={{ width: 7, height: 7, background: mtv.hot, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: fontPoster,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: mtv.caps,
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              Live channels
            </span>
          </span>
          <span style={{ fontFamily: fontMono, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", color: color.muted }}>
            {SCENE_CHANNELS.length} on the dial
          </span>
        </div>
        <Rail gap={12}>
          {DOOR_CHANNELS.map((ch, i) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              size={128}
              eager={i < 4}
              onClick={() => {
                setMode("signup");
                setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
              }}
            />
          ))}
        </Rail>
      </div>

      {/* ── CHARTS TEASER ─────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, margin: "32px 20px 0" }}>
        <div
          style={{
            borderRadius: 14,
            overflow: "hidden",
            background: radioStyle.moduleFace,
            border: "1px solid rgba(200,210,222,0.12)",
            boxShadow: "inset 0 1px 0 rgba(216,223,232,0.08), 0 12px 32px rgba(6,10,16,0.3)",
          }}
        >
          <CardMast live={!!liveRows} right={liveRows ? "Request to climb ↑" : "NOT LIVE DATA"}>
            {liveRows ? "This Month's Chart · Top 5" : "Sample board · Top 5"}
          </CardMast>

          {/* Chart rows */}
          {chartRows.map((row, i) => (
            <ChartRow key={row.rank} {...row} last={i === chartRows.length - 1} />
          ))}

          {/* CTA row */}
          <div
            style={{
              padding: "12px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: color.body,
              fontFamily: fontDisplay,
              letterSpacing: -0.1,
              borderTop: "1px solid rgba(200,210,222,0.10)",
              textAlign: "center",
            }}
          >
            {liveRows
              ? "Sign up to request, and see the full board →"
              : "Sign up to see the live board →"}
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
            border: "1px solid rgba(200,210,222,0.12)",
            boxShadow: "inset 0 1px 0 rgba(216,223,232,0.08), 0 12px 32px rgba(6,10,16,0.3)",
          }}
        >
          <CardMast>Liner Notes — What's On This Disc</CardMast>
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
          background: radioStyle.moduleFace,
          border: radioStyle.border,
          borderRadius: 14,
          boxShadow: "inset 0 1px 0 rgba(216,223,232,0.08), 0 16px 44px rgba(6,10,16,0.4)",
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
            boxShadow: "0 1px 0 rgba(28,32,40,0.22), 0 4px 16px rgba(6,10,16,0.18)",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <GoogleMark />
          <span style={{ fontSize: 16, fontWeight: 600, color: color.onAccent }}>
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
          <div style={{ flex: 1, height: 1, background: color.line }} />
          <span style={{ fontSize: 12, color: color.muted, letterSpacing: 0.2 }}>or email</span>
          <div style={{ flex: 1, height: 1, background: color.line }} />
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${color.line}` }}>
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
                color: mode === m.id ? color.ink : color.muted,
                borderBottom: mode === m.id ? `2px solid ${color.ink}` : "2px solid transparent",
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
