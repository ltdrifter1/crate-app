/**
 * Auth entry — premium glass threshold. Google first, then email.
 */
import { useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius,
  APP_STYLE,
} from "../../theme";
import { authErrorMessage } from "../../lib/phone";
import { BrandGlyph } from "../brand/BrandMark";
import BrandTagline from "../brand/BrandTagline";
import { BRAND_NAME } from "../../theme";

/** Re-enable when Firebase phone + reCAPTCHA are configured for production. */
const ENABLE_PHONE_SIGN_IN = false;

// ── Glass system for the threshold ─────────────────────────────────────────
const GLASS_PANEL = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.085) 0%, rgba(255,255,255,0.035) 100%)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 26,
  backdropFilter: "blur(36px) saturate(1.25)",
  WebkitBackdropFilter: "blur(36px) saturate(1.25)",
  boxShadow: `
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 0 0 0.5px rgba(255,255,255,0.05),
    0 32px 90px rgba(0,0,0,0.65)
  `,
};

const GLASS_BTN = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  padding: "15px 20px",
  borderRadius: 980,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.17) 0%, rgba(255,255,255,0.07) 100%)",
  backdropFilter: "blur(24px) saturate(1.3)",
  WebkitBackdropFilter: "blur(24px) saturate(1.3)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 14px 36px rgba(0,0,0,0.45)",
  color: color.ink,
  fontSize: 16,
  fontWeight: 650,
  fontFamily: fontDisplay,
  letterSpacing: -0.2,
  cursor: "pointer",
  transition: "background 0.2s ease, box-shadow 0.25s ease, transform 0.12s ease",
};

const GLASS_BTN_QUIET = {
  ...GLASS_BTN,
  background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px rgba(0,0,0,0.35)",
  fontWeight: 600,
};

const GLASS_INPUT = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.3)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
  outline: "none",
};

/** Planet horizon + orbit — the same world as the Home hero. */
function ThresholdAtmosphere() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse 130% 90% at 78% -25%, rgba(242,243,245,0.075) 0%, transparent 55%),
          radial-gradient(ellipse 100% 70% at 15% 115%, rgba(242,243,245,0.05) 0%, transparent 50%),
          #000000
        `,
      }}/>
      {/* Planet crest at the foot */}
      <div style={{
        position: "absolute",
        left: "50%",
        bottom: "-88vw",
        width: "170vw",
        height: "170vw",
        minWidth: 950,
        minHeight: 950,
        transform: "translateX(-50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 16%, #16161A 0%, #0A0A0C 44%, #000 78%)",
        boxShadow: `
          0 -1px 0 rgba(242,243,245,0.26),
          0 -20px 70px rgba(242,243,245,0.09),
          0 -70px 180px rgba(242,243,245,0.045)
        `,
      }}/>
      {/* Orbit ring drifting slowly */}
      <div style={{
        position: "absolute",
        left: "50%",
        bottom: "-92vw",
        width: "182vw",
        height: "182vw",
        minWidth: 1030,
        minHeight: 1030,
        transform: "translateX(-50%)",
        borderRadius: "50%",
        border: "1px solid rgba(242,243,245,0.12)",
        animation: "spin 260s linear infinite",
      }}>
        <div style={{
          position: "absolute", top: "1.4%", left: "50%",
          width: 6, height: 6, borderRadius: "50%",
          transform: "translateX(-50%)",
          background: color.accent,
          boxShadow: `0 0 12px ${color.accentGlow}, 0 0 4px ${color.accent}`,
        }}/>
      </div>
      {/* Starfield */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          radial-gradient(circle at 12% 16%, rgba(242,243,245,0.5) 0 1px, transparent 1.4px),
          radial-gradient(circle at 80% 10%, rgba(242,243,245,0.4) 0 1px, transparent 1.4px),
          radial-gradient(circle at 64% 30%, rgba(242,243,245,0.26) 0 0.8px, transparent 1.2px),
          radial-gradient(circle at 30% 6%, rgba(242,243,245,0.3) 0 0.8px, transparent 1.2px),
          radial-gradient(circle at 92% 38%, rgba(242,243,245,0.2) 0 0.8px, transparent 1.2px),
          radial-gradient(circle at 6% 44%, rgba(242,243,245,0.16) 0 0.7px, transparent 1px)
        `,
      }}/>
      {/* Foot vignette */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 160,
        background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 70%, #000 100%)",
      }}/>
    </div>
  );
}

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
  const [method] = useState("email");
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
  const [showEmail, setShowEmail] = useState(false);

  const displayError = error || (authError ? authErrorMessage(authError) : "");

  function resetMessages() {
    setError("");
    setNotice("");
    onClearAuthError?.();
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
    <div style={{ ...APP_STYLE, position: "relative", justifyContent: "center", minHeight: "100vh" }}>
      <ThresholdAtmosphere />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          padding: "44px 20px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          animation: "stationIn 0.7s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: font,
        }}
      >
        {/* Brand moment */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
          <div style={{
            width: 84, height: 84, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 18px 50px rgba(0,0,0,0.5), 0 0 60px ${color.accentGlow}`,
            position: "relative",
          }}>
            <BrandGlyph size={44} title="" />
          </div>
          <div>
            <div style={{
              fontSize: "clamp(34px, 9vw, 44px)",
              fontWeight: 800,
              letterSpacing: -1.4,
              lineHeight: 1,
              color: color.ink,
              fontFamily: fontDisplay,
              marginBottom: 10,
            }}>
              {BRAND_NAME}
            </div>
            <BrandTagline light size={11} style={{ textAlign: "center", maxWidth: "none", color: color.onDarkMuted }} />
          </div>
        </div>

        {/* Glass threshold card */}
        <div style={{ ...GLASS_PANEL, width: "100%", padding: "22px 18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              ...GLASS_BTN,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            <GoogleMark />
            {loading && notice?.includes("Google") ? "Connecting…" : "Continue with Google"}
          </button>

          {(displayError || notice) && (
            <div
              role={displayError ? "alert" : "status"}
              style={{
                fontSize: 13,
                color: displayError ? color.ink : color.body,
                background: displayError ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.3)",
                border: `1px solid ${displayError ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.09)"}`,
                borderRadius: radius.md,
                padding: "12px 14px",
                lineHeight: 1.45,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              {displayError || notice}
            </div>
          )}

          {!showEmail ? (
            <button
              type="button"
              onClick={() => { resetMessages(); setShowEmail(true); }}
              style={GLASS_BTN_QUIET}
            >
              Continue with email
            </button>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 2px" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                <span style={{
                  fontSize: 10, color: color.faint, letterSpacing: 1.6,
                  fontFamily: fontMono, textTransform: "uppercase",
                }}>
                  {mode === "signup" ? "Create account" : "Sign in with email"}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {mode === "signup" && (
                <input
                  placeholder="Display name"
                  aria-label="Display name"
                  autoComplete="nickname"
                  style={GLASS_INPUT}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <input
                placeholder="Email"
                type="email"
                aria-label="Email"
                autoComplete="email"
                style={GLASS_INPUT}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div style={{ position: "relative" }}>
                <input
                  placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
                  type={showPass ? "text" : "password"}
                  aria-label="Password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  style={{ ...GLASS_INPUT, paddingRight: 72 }}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleEmailSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 14,
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
                  style={GLASS_INPUT}
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
              )}

              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={loading}
                style={{ ...GLASS_BTN, opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px 0" }}>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    resetMessages();
                    setPass2("");
                  }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: color.body, fontWeight: 600, fontSize: 12.5,
                  }}
                >
                  {mode === "login" ? "New here? Create account" : "Have an account? Sign in"}
                </button>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: color.faint, fontWeight: 600, fontSize: 12.5,
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}

          {ENABLE_PHONE_SIGN_IN && method === "phone" && (
            <div id="recaptcha-container" aria-hidden="true" />
          )}
        </div>

        {/* Quiet footer */}
        <div style={{
          fontSize: 10.5, color: color.faint, letterSpacing: 1.4,
          fontFamily: fontMono, textTransform: "uppercase", textAlign: "center",
        }}>
          Ad-free listening · Curated by humans
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
