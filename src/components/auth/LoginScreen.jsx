/**
 * Auth entry — Google first, then email. Single screen (no invite gate).
 */
import { useState } from "react";
import {
  font, fontDisplay, color, radius, glass, aluminumGradient,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY,
} from "../../theme";
import { authErrorMessage } from "../../lib/phone";
import BrandTagline from "../brand/BrandTagline";
import { BrandLockup } from "../brand/BrandGlyphs";

/** Re-enable when Firebase phone + reCAPTCHA are configured for production. */
const ENABLE_PHONE_SIGN_IN = false;

const methodTab = (active) => ({
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "6px 0",
  fontSize: 13,
  fontWeight: active ? 600 : 500,
  color: active ? color.accent : color.faint,
  fontFamily: font,
  letterSpacing: 0.2,
});

export default function LoginScreen({
  onSignUp,
  onLogIn,
  onGoogleSignIn,
  onPhoneOTP,
  onVerifyOTP,
  onResetPassword,
  authError = null,
  onClearAuthError,
}) {
  const [method, setMethod] = useState("email");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);
  const [phoneStep, setPhoneStep] = useState("enter");
  const [showPass, setShowPass] = useState(false);

  const displayError = error || (authError ? authErrorMessage(authError) : "");

  function resetMessages() {
    setError("");
    setNotice("");
    onClearAuthError?.();
  }

  function switchMethod(next) {
    if (!ENABLE_PHONE_SIGN_IN && next === "phone") return;
    setMethod(next);
    resetMessages();
    setPhoneStep("enter");
    setOtp("");
    setConfirmResult(null);
  }

  async function handleGoogleSignIn() {
    resetMessages();
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
        setError(authErrorMessage(e, "Google sign-in failed. Try email, or add this site to Firebase authorized domains."));
      }
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
      await onResetPassword(email.trim());
      setNotice("Password reset email sent. Check your inbox.");
    } catch (e) {
      setError(authErrorMessage(e, "Couldn't send reset email right now."));
    }
    setLoading(false);
  }

  async function handleSendOTP() {
    if (!ENABLE_PHONE_SIGN_IN) return;
    resetMessages();
    setLoading(true);
    try {
      const { normalizePhoneE164, phoneHint } = await import("../../lib/phone");
      const e164 = normalizePhoneE164(phone);
      if (!e164) {
        setError("Enter a valid mobile number.");
        setLoading(false);
        return;
      }
      const result = await onPhoneOTP(e164, "recaptcha-container");
      setConfirmResult(result);
      setPhoneStep("verify");
      setNotice(`Code sent to ${phoneHint(e164) || e164}.`);
    } catch (e) {
      setError(authErrorMessage(e, "Couldn't send code — try email or Google."));
    }
    setLoading(false);
  }

  async function handleVerifyOTP() {
    if (!ENABLE_PHONE_SIGN_IN) return;
    resetMessages();
    setLoading(true);
    try {
      await onVerifyOTP(confirmResult, otp.trim());
    } catch (e) {
      setError(authErrorMessage(e, "Invalid code — try again"));
    }
    setLoading(false);
  }

  async function handleEmailSubmit() {
    resetMessages();
    if (mode === "signup") {
      if (!name.trim()) {
        setError("Choose a display name.");
        return;
      }
      if (!email.trim()) {
        setError("Enter an email address.");
        return;
      }
      if (pass.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (pass !== pass2) {
        setError("Passwords don’t match.");
        return;
      }
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
    <div style={{ ...APP_STYLE, position: "relative", justifyContent: "flex-end" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: aluminumGradient(),
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 55% at 50% 8%, rgba(180,190,205,0.35) 0%, transparent 58%), radial-gradient(ellipse 70% 40% at 80% 90%, rgba(160,170,185,0.18) 0%, transparent 55%)",
        }}
      />
      {/* Soft brand wash — oversized lockup, barely there */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "16%",
          width: "min(148vw, 820px)",
          height: "min(148vw, 820px)",
          transform: "translate(-50%, -50%)",
          backgroundImage: "url(/brand/planet-mp3-lockup-on-black.png)",
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: 0.07,
          pointerEvents: "none",
          filter: "blur(1.5px) grayscale(0.2)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 440,
          margin: "0 auto",
          padding: "28px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          animation: "stationIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: font,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
            paddingTop: 4,
          }}
        >
          <div
            style={{
              width: "min(72vw, 280px)",
              animation: "brandLockupBreathe 6.5s ease-in-out infinite",
            }}
          >
            <BrandLockup size={280} onBlack />
          </div>
          <BrandTagline
            size={11}
            style={{
              color: color.muted,
              letterSpacing: 0.16,
              margin: 0,
            }}
          />
          {mode === "signup" && (
            <div style={{ fontSize: 15, color: color.body, lineHeight: 1.5, maxWidth: 280 }}>
              Join free — Club is $0.99/mo. Premium is $10/yr with Club Credit ready for Club Copy.
            </div>
          )}
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "20px 18px 18px",
            background: glass.plate,
            border: `1px solid ${glass.border}`,
            borderRadius: radius.xl,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
            backdropFilter: glass.blurHeavy,
            WebkitBackdropFilter: glass.blurHeavy,
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px 20px",
              borderRadius: radius.md,
              border: "1px solid rgba(22,24,30,0.2)",
              background: `
                linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 42%),
                linear-gradient(165deg, #EDF0F4 0%, #C4CBD4 100%)
              `,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), ${glass.shadowSoft}`,
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
            <span style={{ fontSize: 12, color: color.faint, letterSpacing: 0.2 }}>or email</span>
            <div style={{ flex: 1, height: 1, background: color.line }} />
          </div>

          {ENABLE_PHONE_SIGN_IN && (
            <div style={{ display: "flex", gap: 18 }}>
              {[
                { id: "email", label: "Email" },
                { id: "phone", label: "Phone" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchMethod(item.id)}
                  style={methodTab(method === item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {method === "email" && (
            <>
              <div style={{ display: "flex", gap: 16, borderBottom: `1px solid ${color.line}` }}>
                {[
                  { id: "login", label: "Log in" },
                  { id: "signup", label: "Create account" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      resetMessages();
                      setPass2("");
                    }}
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
                      borderBottom: mode === m.id ? `2px solid ${color.accent}` : "2px solid transparent",
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
                  onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleEmailSubmit()}
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
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
              )}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
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
                className="btn-secondary"
                onClick={handleEmailSubmit}
                disabled={loading}
                style={{ ...BTN_SECONDARY, opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in with email"
                    : "Create account"}
              </button>
            </>
          )}

          {ENABLE_PHONE_SIGN_IN && method === "phone" && (
            <div id="recaptcha-container" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77.01-.53z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
