/**
 * Auth entry — Google first (popup → redirect fallback), then email / phone.
 */
import { useEffect, useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius,
  APP_STYLE, INPUT_ST, BTN_PRIMARY, BTN_SECONDARY,
  BRAND_NAME, BRAND_TAGLINE,
} from "../../theme";
import { getFloorPhase } from "../../lib/club";
import { authErrorMessage, normalizePhoneE164, phoneHint } from "../../lib/phone";
import BrandMark, { BrandGlyph as DoorGlyph } from "../brand/BrandMark";
import RoomPosterBackdrop from "../brand/RoomPosterBackdrop";

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
  // Skip invite friction when a redirect error needs to be shown
  const [gate, setGate] = useState(authError ? "auth" : "invite");
  const [method, setMethod] = useState("email"); // email | phone
  const [mode, setMode] = useState("login"); // login | signup (email only)
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

  const floor = getFloorPhase();
  const thresholdAtmosphere = floor?.id || "warmup";
  const e164Preview = phoneHint(phone);
  const displayError = error || (authError ? authErrorMessage(authError) : "");

  useEffect(() => {
    if (authError) setGate("auth");
  }, [authError]);

  function resetMessages() {
    setError("");
    setNotice("");
    onClearAuthError?.();
  }

  function switchMethod(next) {
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
      // null ⇒ redirect started; page is navigating away
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
    if (!phone.trim()) {
      setError("Enter a mobile number");
      return;
    }
    const e164 = normalizePhoneE164(phone);
    if (!e164) {
      setError("Enter a valid mobile number (US can omit +1).");
      return;
    }
    resetMessages();
    setLoading(true);
    try {
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
    if (!otp.trim()) {
      setError("Enter the verification code");
      return;
    }
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
    } else {
      if (!email.trim() || !pass) {
        setError("Enter email and password.");
        return;
      }
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

  if (gate === "invite") {
    return (
      <div style={{ ...APP_STYLE, position: "relative" }}>
        <RoomPosterBackdrop
          atmosphere={thresholdAtmosphere}
          minHeight="100vh"
          style={{
            flex: 1,
            padding: "56px 24px 48px",
            justifyContent: "flex-end",
            animation: "stationIn 0.85s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2.2,
                color: color.accent,
                fontFamily: fontMono,
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              {floor?.label || "Listen"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <DoorGlyph size={56} title="" />
              <div
                style={{
                  fontSize: "clamp(52px, 16vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: -2.4,
                  lineHeight: 0.9,
                  color: color.onDark,
                  fontFamily: fontDisplay,
                }}
              >
                {BRAND_NAME}
              </div>
            </div>
            <p
              style={{
                fontSize: 17,
                color: color.body,
                lineHeight: 1.5,
                maxWidth: 300,
                marginBottom: 28,
              }}
            >
              {BRAND_TAGLINE}. Your music, simply.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                maxWidth: 320,
                padding: "14px 20px",
                borderRadius: 980,
                border: "none",
                background: color.accent,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginBottom: 12,
              }}
            >
              <GoogleMark />
              <span style={{ fontSize: 16, fontWeight: 600, color: color.onAccent }}>
                {loading ? "Connecting…" : "Continue with Google"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { resetMessages(); setGate("auth"); }}
              style={{
                background: "none",
                border: "none",
                color: color.body,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                padding: "10px 4px",
              }}
            >
              Use email or phone
            </button>
            {(displayError || notice) && (
              <div
                role={displayError ? "alert" : "status"}
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: displayError ? color.alert : color.body,
                  background: displayError ? "rgba(255,69,58,0.12)" : "rgba(0,0,0,0.35)",
                  border: `1px solid ${displayError ? "rgba(255,69,58,0.35)" : color.line}`,
                  borderRadius: radius.md,
                  padding: "12px 14px",
                  lineHeight: 1.45,
                  maxWidth: 320,
                }}
              >
                {displayError || notice}
              </div>
            )}
          </div>
        </RoomPosterBackdrop>
      </div>
    );
  }

  return (
    <div style={{ ...APP_STYLE, position: "relative", justifyContent: "flex-end" }}>
      <RoomPosterBackdrop
        atmosphere={thresholdAtmosphere}
        minHeight="100%"
        style={{ position: "absolute", inset: 0, minHeight: "100%" }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          padding: "36px 20px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          animation: "stationIn 0.55s cubic-bezier(0.22,1,0.36,1) both",
          fontFamily: font,
        }}
      >
        <div>
          <button
            type="button"
            onClick={() => setGate("invite")}
            style={{
              background: "none",
              border: "none",
              color: color.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 14,
              padding: 0,
            }}
          >
            ← Back
          </button>
          <div style={{ marginBottom: 8 }}>
            <BrandMark size={44} light />
          </div>
          <div style={{ fontSize: 15, color: color.body, lineHeight: 1.5, maxWidth: 320 }}>
            {method === "phone"
              ? "We’ll text a one-time code. No password to remember."
              : mode === "signup"
                ? "Create an account to start listening."
                : "Sign in to continue."}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "18px 16px 16px",
            background: color.surfaceSolid,
            border: `1px solid ${color.line}`,
          }}
        >
          {/* Google first — popup with redirect fallback */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px 20px",
              borderRadius: 980,
              border: `1px solid ${color.lineStrong}`,
              background: color.accent,
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
                background: displayError ? "rgba(255,69,58,0.08)" : color.canvas,
                border: `1px solid ${displayError ? "rgba(255,69,58,0.25)" : color.line}`,
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
            <span style={{ fontSize: 12, color: color.faint, letterSpacing: 0.2 }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: color.line }} />
          </div>

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
                onClick={handleEmailSubmit}
                disabled={loading}
                style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "login"
                    ? "Enter"
                    : "Create account"}
              </button>
            </>
          )}

          {method === "phone" && (
            <>
              {phoneStep === "enter" ? (
                <>
                  <input
                    placeholder="Mobile number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-label="Phone number"
                    style={INPUT_ST}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  />
                  <div style={{ fontSize: 12, color: color.faint, lineHeight: 1.45, marginTop: -4 }}>
                    {e164Preview
                      ? <>Sending to <span style={{ color: color.muted, fontFamily: fontMono }}>{e164Preview}</span></>
                      : "US numbers can omit +1. Others need a country code."}
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || !normalizePhoneE164(phone)}
                    style={{
                      ...BTN_PRIMARY,
                      opacity: loading || !normalizePhoneE164(phone) ? 0.55 : 1,
                    }}
                  >
                    {loading ? "Sending…" : "Text me a code"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45 }}>
                    Enter the 6-digit code sent to{" "}
                    <span style={{ color: color.ink, fontFamily: fontMono }}>
                      {phoneHint(phone) || phone}
                    </span>
                  </div>
                  <input
                    placeholder="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Verification code"
                    style={{
                      ...INPUT_ST,
                      letterSpacing: 4,
                      fontFamily: fontMono,
                      fontSize: 18,
                      textAlign: "center",
                    }}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep("enter");
                        setOtp("");
                        setConfirmResult(null);
                        resetMessages();
                      }}
                      style={{ ...BTN_SECONDARY, flex: 1 }}
                    >
                      Edit number
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.length < 6}
                      style={{
                        ...BTN_PRIMARY,
                        flex: 1,
                        opacity: loading || otp.length < 6 ? 0.55 : 1,
                      }}
                    >
                      {loading ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: color.muted,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    Resend code
                  </button>
                </>
              )}
            </>
          )}

          {/* Single stable mount for Firebase reCAPTCHA (invisible → visible fallback) */}
          <div
            id="recaptcha-container"
            aria-hidden={method !== "phone"}
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: method === "phone" ? 8 : 0,
              minHeight: method === "phone" ? 4 : 0,
              // Keep in layout for widget init; collapse when not on phone
              maxHeight: method === "phone" ? 90 : 0,
              overflow: method === "phone" ? "visible" : "hidden",
              opacity: method === "phone" ? 1 : 0,
              pointerEvents: method === "phone" ? "auto" : "none",
            }}
          />

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
