/**
 * Public site while Planet MP3 is closed.
 * One screen: the station is under construction, and an email gets the beta note.
 */
import { useEffect, useState } from "react";
import { BrandLockup } from "../components/brand/BrandGlyphs";
import { BRAND_NAME, BRAND_TAGLINE } from "../brand/identity";
import { isValidBetaEmail, joinBetaWaitlist, normalizeBetaEmail } from "../lib/betaWaitlist";
import { BTN_PRIMARY, INPUT_ST, color, font, fontMono, fontPoster } from "../theme";

export const BETA_SIGNUP_STORAGE_KEY = "planetmp3.betaWaitlist";

function readRememberedEmail() {
  try {
    const stored = window.localStorage.getItem(BETA_SIGNUP_STORAGE_KEY);
    return stored && isValidBetaEmail(stored) ? normalizeBetaEmail(stored) : "";
  } catch {
    return "";
  }
}

function rememberEmail(email) {
  try {
    window.localStorage.setItem(BETA_SIGNUP_STORAGE_KEY, email);
  } catch {
    /* private mode — the list still has the address */
  }
}

export default function UnderConstructionScreen() {
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    document.title = `${BRAND_NAME} — Under construction`;
    setSavedEmail(readRememberedEmail());
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    if (pending) return;
    setError("");
    if (!isValidBetaEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending(true);
    try {
      const saved = await joinBetaWaitlist(email);
      rememberEmail(saved.email);
      setSavedEmail(saved.email);
      setEmail("");
    } catch (error) {
      setError(
        error?.code === "permission-denied"
          ? "Signups aren't open yet. Try again soon."
          : "Couldn't save that. Check your connection and try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: "32px 20px 40px",
        background: `
          radial-gradient(ellipse 68% 42% at 50% 12%, rgba(247,77,122,0.20) 0%, transparent 62%),
          ${color.canvas}
        `,
        color: color.ink,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <BrandLockup size={132} />

        <p
          style={{
            margin: "18px 0 0",
            fontFamily: fontMono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: color.accent,
          }}
        >
          Beta launching soon
        </p>

        <h1
          style={{
            margin: "12px 0 0",
            fontFamily: fontPoster,
            fontWeight: 400,
            fontSize: "clamp(56px, 16vw, 84px)",
            lineHeight: 0.82,
            letterSpacing: -0.4,
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          Under
          <br />
          construction
        </h1>

        <p
          style={{
            margin: "18px 0 0",
            maxWidth: 360,
            fontFamily: font,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.45,
            letterSpacing: -0.16,
            color: color.body,
          }}
        >
          {BRAND_NAME} is closed while we finish the station. Sign up and
          we&apos;ll email you when the beta opens.
        </p>

        {savedEmail ? (
          <div role="status" style={{ width: "100%", marginTop: 28 }}>
            <p
              style={{
                margin: 0,
                fontFamily: fontPoster,
                fontSize: 32,
                fontWeight: 400,
                lineHeight: 0.9,
                letterSpacing: -0.2,
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              You&apos;re on the list
            </p>
            <p
              style={{
                margin: "12px 0 0",
                fontFamily: font,
                fontSize: 15,
                lineHeight: 1.45,
                color: color.body,
                overflowWrap: "anywhere",
              }}
            >
              We&apos;ll email {savedEmail} when the beta launches.
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedEmail("");
                setError("");
              }}
              style={{
                marginTop: 16,
                padding: 0,
                border: 0,
                background: "transparent",
                color: color.muted,
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            style={{ width: "100%", marginTop: 28 }}
          >
            <label
              htmlFor="beta-email"
              style={{
                display: "block",
                marginBottom: 8,
                textAlign: "left",
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: color.muted,
              }}
            >
              Email
            </label>
            <input
              id="beta-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              placeholder="you@email.com"
              value={email}
              disabled={pending}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "beta-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                ...INPUT_ST,
                boxSizing: "border-box",
                border: focused
                  ? `1px solid ${color.accent}`
                  : INPUT_ST.border,
              }}
            />
            <button
              type="submit"
              disabled={pending}
              style={{
                ...BTN_PRIMARY,
                marginTop: 12,
                boxSizing: "border-box",
                opacity: pending ? 0.65 : 1,
                cursor: pending ? "wait" : "pointer",
              }}
            >
              {pending ? "Saving…" : "Sign up"}
            </button>
            {error ? (
              <p
                id="beta-email-error"
                role="alert"
                style={{
                  margin: "12px 0 0",
                  fontFamily: font,
                  fontSize: 14,
                  lineHeight: 1.4,
                  color: color.accent,
                }}
              >
                {error}
              </p>
            ) : (
              <p
                style={{
                  margin: "12px 0 0",
                  fontFamily: font,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: color.faint,
                }}
              >
                One note when the beta launches. Nothing else.
              </p>
            )}
          </form>
        )}

        <p
          style={{
            margin: "36px 0 0",
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: color.faint,
          }}
        >
          {BRAND_TAGLINE}
        </p>
      </div>
    </main>
  );
}
