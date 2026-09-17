import { useMemo, useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius, y2k, chrome, glass,
  BTN_PRIMARY, BTN_SECONDARY, motion,
} from "../../theme";
import BrandMark from "../brand/BrandMark";
import CoverImage from "../ui/CoverImage";
import { resolveChannelArt } from "../../lib/channelArt";
import { tasteProfileBlurb } from "../../lib/tasteProfile";
import {
  ONBOARDING_MAX_CHANNELS,
  ONBOARDING_MIN_CHANNELS,
  ENERGY_CHOICES,
  STRETCH_CHOICES,
  onboardingChannels,
  artistFacesForChannels,
  compileOnboardingTaste,
} from "../../lib/onboardingTaste";

const STEPS = ["stations", "faces", "dial", "ready"];

function stepIndex(id) {
  return STEPS.indexOf(id);
}

function Progress({ step }) {
  const i = stepIndex(step);
  return (
    <div
      aria-hidden="true"
      style={{ display: "flex", gap: 6, marginBottom: 22 }}
    >
      {STEPS.map((id, idx) => (
        <span
          key={id}
          style={{
            width: idx === i ? 22 : 6,
            height: 6,
            borderRadius: 99,
            background: idx <= i ? y2k.cyan : "rgba(255,255,255,0.12)",
            boxShadow: idx === i ? `0 0 10px ${y2k.cyanGlow}` : "none",
            transition: `width ${motion.fast} ${motion.ease}, background ${motion.base}`,
          }}
        />
      ))}
    </div>
  );
}

function StationCard({ channel, on, onToggle, index }) {
  const { src, focus } = resolveChannelArt(channel);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`${on ? "Untune" : "Tune"} ${channel.title}`}
      style={{
        position: "relative",
        minHeight: 168,
        padding: 0,
        borderRadius: radius.xl,
        border: on ? `1px solid ${y2k.cyan}` : `1px solid ${glass.borderSoft}`,
        overflow: "hidden",
        background: color.surfaceSolid,
        cursor: "pointer",
        textAlign: "left",
        color: color.onDark,
        boxShadow: on
          ? `0 0 0 1px ${y2k.cyan}, 0 12px 28px rgba(0,0,0,0.4)`
          : `inset 0 1px 0 ${glass.highlight}`,
        animation: `rise 0.45s ${motion.ease} ${Math.min(index, 8) * 0.03}s both`,
      }}
    >
      {src ? (
        <CoverImage
          src={src}
          alt=""
          width={280}
          height={168}
          eager={index < 4}
          priority={index === 0}
          objectPosition={focus}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(160deg, ${channel.accent || "#3A414C"} 0%, #10141A 80%)`,
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(8,10,13,0.08) 20%, rgba(8,10,13,0.92) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          minHeight: 168,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "14px 14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: on ? y2k.cyan : color.faint,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {on ? "Tuned" : `CH-${String(channel.num).padStart(2, "0")}`}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 720,
            fontFamily: fontDisplay,
            letterSpacing: -0.35,
            color: color.onDark,
            lineHeight: 1.15,
          }}
        >
          {channel.shortTitle || channel.title}
        </div>
      </div>
    </button>
  );
}

function FaceCard({ face, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      style={{
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        textAlign: "center",
        color: color.ink,
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: 18,
          overflow: "hidden",
          border: on ? `1.5px solid ${y2k.cyan}` : `1px solid ${glass.borderSoft}`,
          boxShadow: on ? `0 0 0 1px ${y2k.cyanGlow}` : "none",
          background: color.surfaceSolid,
        }}
      >
        {face.cover ? (
          <CoverImage
            src={face.cover}
            alt=""
            width={120}
            height={120}
            eager
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              fontFamily: fontDisplay,
              fontSize: 28,
              fontWeight: 700,
              color: color.muted,
            }}
          >
            {(face.name || "?").charAt(0)}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 650,
          fontFamily: fontDisplay,
          letterSpacing: -0.2,
          color: on ? y2k.cyan : color.body,
          lineHeight: 1.2,
        }}
      >
        {face.name}
      </div>
    </button>
  );
}

function ChoiceCard({ choice, on, onPick, art }) {
  const { src, focus } = resolveChannelArt({ id: choice.artChannelId, art: art?.src });
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      style={{
        position: "relative",
        minHeight: 148,
        padding: 0,
        borderRadius: radius.xl,
        border: on ? `1px solid ${y2k.cyan}` : `1px solid ${glass.border}`,
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "left",
        color: color.onDark,
        background: color.surfaceSolid,
        boxShadow: on ? `0 0 0 1px ${y2k.cyan}` : `inset 0 1px 0 ${glass.highlight}`,
      }}
    >
      {src && (
        <CoverImage
          src={src}
          alt=""
          width={320}
          height={148}
          eager
          objectPosition={focus}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: on
            ? "linear-gradient(180deg, rgba(8,10,13,0.15), rgba(8,10,13,0.88))"
            : "linear-gradient(180deg, rgba(8,10,13,0.25), rgba(8,10,13,0.92))",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, padding: "18px 18px 20px", minHeight: 148, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 720,
            fontFamily: fontDisplay,
            letterSpacing: -0.5,
            marginBottom: 4,
          }}
        >
          {choice.label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: color.body, lineHeight: 1.35 }}>
          {choice.hint}
        </div>
      </div>
    </button>
  );
}

/**
 * First-visit tuner — stations, faces, this-or-that. Not a survey.
 */
export default function TasteTuner({
  tracks = [],
  onComplete,
  onSkip,
}) {
  const channels = useMemo(() => onboardingChannels(), []);
  const [step, setStep] = useState("stations");
  const [channelIds, setChannelIds] = useState([]);
  const [artistNames, setArtistNames] = useState([]);
  const [energyId, setEnergyId] = useState(null);
  const [stretchId, setStretchId] = useState(null);

  const faces = useMemo(
    () => artistFacesForChannels(tracks, channelIds),
    [tracks, channelIds]
  );

  const taste = useMemo(
    () => compileOnboardingTaste({ channelIds, artistNames, energyId, stretchId }),
    [channelIds, artistNames, energyId, stretchId]
  );

  const seed = channels.find((c) => c.id === taste.seedChannelId) || channels[0];
  const seedArt = resolveChannelArt(seed);

  function toggleChannel(id) {
    setChannelIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= ONBOARDING_MAX_CHANNELS) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  function toggleArtist(name) {
    setArtistNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  }

  function goFromStations() {
    if (channelIds.length < ONBOARDING_MIN_CHANNELS) return;
    setStep(faces.length >= 4 ? "faces" : "dial");
  }

  function finish(fromSkip = false) {
    const bag = fromSkip
      ? compileOnboardingTaste({ skip: true })
      : compileOnboardingTaste({ channelIds, artistNames, energyId, stretchId });
    if (fromSkip && onSkip) onSkip(bag);
    else onComplete?.(bag);
  }

  const heading =
    step === "stations"
      ? "Tune the stations that sound like you"
      : step === "faces"
        ? "Anyone you already love?"
        : step === "dial"
          ? "How should the mix feel?"
          : "Your mix is locked";

  const sub =
    step === "stations"
      ? "Tap up to three. We’ll drop you on the first one."
      : step === "faces"
        ? "Optional. Skip if you’d rather discover."
        : step === "dial"
          ? "Two taps. No sliders."
          : tasteProfileBlurb(taste);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: color.canvas,
        overflow: "auto",
        fontFamily: font,
        animation: "fadeIn 0.4s ease both",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "42vh",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(101,230,255,0.08) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 560, margin: "0 auto", padding: "40px 20px 140px" }}>
        <div style={{ marginBottom: 16 }}>
          <BrandMark size={36} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 1.8,
            color: chrome.signal || y2k.cyan,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          {step === "stations"
            ? "Your station"
            : step === "faces"
              ? "Your people"
              : step === "dial"
                ? "Your night"
                : "Ready"}
        </div>
        <Progress step={step} />
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px, 7vw, 40px)",
            fontWeight: 720,
            letterSpacing: -1.3,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.04,
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            margin: "12px 0 24px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.5,
            maxWidth: 380,
          }}
        >
          {sub}
        </p>

        {step === "stations" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {channels.map((channel, i) => (
              <StationCard
                key={channel.id}
                channel={channel}
                on={channelIds.includes(channel.id)}
                onToggle={() => toggleChannel(channel.id)}
                index={i}
              />
            ))}
          </div>
        )}

        {step === "faces" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {faces.map((face) => (
              <FaceCard
                key={face.name}
                face={face}
                on={artistNames.includes(face.name)}
                onToggle={() => toggleArtist(face.name)}
              />
            ))}
          </div>
        )}

        {step === "dial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  fontFamily: fontMono,
                  color: y2k.cyan,
                  marginBottom: 10,
                }}
              >
                Energy
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ENERGY_CHOICES.map((choice) => (
                  <ChoiceCard
                    key={choice.id}
                    choice={choice}
                    on={energyId === choice.id}
                    onPick={() => setEnergyId(choice.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  fontFamily: fontMono,
                  color: y2k.cyan,
                  marginBottom: 10,
                }}
              >
                Stretch
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {STRETCH_CHOICES.map((choice) => (
                  <ChoiceCard
                    key={choice.id}
                    choice={choice}
                    on={stretchId === choice.id}
                    onPick={() => setStretchId(choice.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "ready" && seed && (
          <div
            style={{
              position: "relative",
              borderRadius: radius.xl,
              overflow: "hidden",
              minHeight: 220,
              marginBottom: 20,
              border: `1px solid ${glass.border}`,
            }}
          >
            {seedArt.src && (
              <CoverImage
                src={seedArt.src}
                alt=""
                width={560}
                height={220}
                priority
                objectPosition={seedArt.focus}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(8,10,13,0.1), rgba(8,10,13,0.92))",
              }}
            />
            <div style={{ position: "relative", zIndex: 1, padding: "28px 22px", minHeight: 220, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  fontFamily: fontMono,
                  color: y2k.cyan,
                  marginBottom: 8,
                }}
              >
                Starting on
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 720,
                  fontFamily: fontDisplay,
                  letterSpacing: -0.8,
                  color: color.ink,
                }}
              >
                {seed.title}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: color.body }}>
                {seed.tagline}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {step === "stations" && (
            <>
              <button
                type="button"
                disabled={channelIds.length < ONBOARDING_MIN_CHANNELS}
                onClick={goFromStations}
                style={{
                  ...BTN_PRIMARY,
                  borderRadius: radius.md,
                  padding: "16px 28px",
                  opacity: channelIds.length < ONBOARDING_MIN_CHANNELS ? 0.4 : 1,
                  cursor: channelIds.length < ONBOARDING_MIN_CHANNELS ? "default" : "pointer",
                }}
              >
                {channelIds.length === 0
                  ? "Tune a station"
                  : channelIds.length === 1
                    ? "Continue with 1 station"
                    : `Continue with ${channelIds.length} stations`}
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: color.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "10px 0",
                }}
              >
                Wander first
              </button>
            </>
          )}

          {step === "faces" && (
            <>
              <button
                type="button"
                onClick={() => setStep("dial")}
                style={{ ...BTN_PRIMARY, borderRadius: radius.md, padding: "16px 28px" }}
              >
                {artistNames.length ? "Continue" : "Skip faces"}
              </button>
              <button
                type="button"
                onClick={() => setStep("stations")}
                style={{
                  background: "none",
                  border: "none",
                  color: color.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "10px 0",
                }}
              >
                Back
              </button>
            </>
          )}

          {step === "dial" && (
            <>
              <button
                type="button"
                onClick={() => setStep("ready")}
                style={{ ...BTN_PRIMARY, borderRadius: radius.md, padding: "16px 28px" }}
              >
                Lock it in
              </button>
              <button
                type="button"
                onClick={() => setStep(faces.length >= 4 ? "faces" : "stations")}
                style={{
                  background: "none",
                  border: "none",
                  color: color.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "10px 0",
                }}
              >
                Back
              </button>
            </>
          )}

          {step === "ready" && (
            <>
              <button
                type="button"
                onClick={() => finish(false)}
                style={{ ...BTN_PRIMARY, borderRadius: radius.md, padding: "16px 28px" }}
              >
                Start the mix
              </button>
              <button
                type="button"
                onClick={() => setStep("dial")}
                style={{
                  ...BTN_SECONDARY,
                  width: "auto",
                  background: "none",
                  border: "none",
                  boxShadow: "none",
                  backdropFilter: "none",
                  color: color.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  padding: "10px 0",
                }}
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
