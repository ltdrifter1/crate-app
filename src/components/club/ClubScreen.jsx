/**
 * Club — Digital Record Club membership home + settings tabs.
 * Collectible card, listening privileges, Interests (taste), Community Mix.
 */
import { useEffect, useMemo, useState } from "react";
import {
  fontDisplay, fontMono, color, radius, glass, motion,
  BTN_PRIMARY, BTN_SECONDARY, homeSpace,
} from "../../theme";
import {
  membershipSummary,
  formatPriceClub,
  formatPricePremium,
  formatMoney,
  PLAN_IDS,
  BILLING,
} from "../../lib/entitlements";
import { creditSummaryLine } from "../../lib/clubCredit";
import { collectionStats } from "../../lib/collectionStats";
import {
  CLUB_NAME,
  CLUB_TAGLINE,
  formatJoinedMonth,
  memberNumberLabel,
} from "../../lib/memberNumber";
import { formatMonthLabel } from "../../lib/mixes";
import { getFloorPhase, hapticTap } from "../../lib/club";
import { BrandGlyph as DoorGlyph } from "../brand/BrandMark";
import CollapsingHeader from "../layout/CollapsingHeader";
import { InterestsPanel } from "../listen/InterestsPanel";
import CollectorPanel from "./CollectorPanel";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import { freePlaysRemaining, freePlaysMeterLabel } from "../../lib/freePlays";
import { TASTE_AXIS_DEFAULT } from "../../lib/tasteProfile";

let clubVisitedThisSession = false;

const PRIVILEGES_BY_TIER = {
  free: [
    {
      id: "limited",
      label: "Limited streaming",
      blurb: `${BILLING.freePlaysPerDay} plays per day · browse and save taste`,
    },
    {
      id: "upgrade",
      label: "Upgrade anytime",
      blurb: "Club unlocks the full crate and your membership card",
    },
  ],
  club: [
    {
      id: "crate",
      label: "Full streaming",
      blurb: "Unlimited listening · harmonic radio · listening booth",
    },
    {
      id: "card",
      label: "Membership card",
      blurb: "Digital card now · member pricing on Club Copy",
    },
  ],
  premium: [
    {
      id: "crate",
      label: "Full streaming",
      blurb: "Everything in Club, unlimited",
    },
    {
      id: "credit",
      label: "Club Credit",
      blurb: `${formatMoney(BILLING.premium.creditGrant)} to spend on Club Copy from liner notes`,
    },
    {
      id: "physical",
      label: "Physical access",
      blurb: "Member pricing and Club Copy editions",
    },
  ],
};

const SETTINGS_TABS = [
  { id: "club", label: "Club" },
  { id: "interests", label: "Interests" },
];

export default function ClubScreen({
  user,
  tracks,
  onLogout,
  onEditGenres = null,
  access = null,
  onSubscribe = null,
  onOpenPlans = null,
  profile = null,
  onOpenMix = null,
  communityMix = null,
  recentTracks = [],
  signalLabel = null,
  onPlayTrack = null,
  initialTab = "club",
}) {
  const [settingsTab, setSettingsTab] = useState(
    initialTab === "interests" ? "interests" : "club"
  );
  const liked = useMemo(() => tracks.filter((t) => t.liked), [tracks]);
  const memberLine = membershipSummary(access);
  const tier = access?.tier || PLAN_IDS.FREE;
  const privileges = PRIVILEGES_BY_TIER[tier] || PRIVILEGES_BY_TIER.free;
  const hasCard = !!access?.membershipCard;
  const stats = useMemo(() => collectionStats(liked), [liked]);
  const memberNo = profile?.memberNumber ?? user.memberNumber;
  const joined = formatJoinedMonth(profile?.createdAt || profile?.clubJoinedAt);
  const curatorBadge = profile?.featuredCuratorMonth || null;
  const floor = useMemo(() => getFloorPhase(), []);
  const mixCount = (communityMix?.trackIds || []).length;
  const mixCurator =
    communityMix?.featuredCurator?.displayName || communityMix?.ownerName || null;
  const creditLine = creditSummaryLine(profile);
  const playsLeft = freePlaysRemaining(profile, access);
  const playsLabel = freePlaysMeterLabel(playsLeft, access);

  useEffect(() => {
    if (clubVisitedThisSession) return;
    clubVisitedThisSession = true;
    hapticTap(10);
  }, []);

  useEffect(() => {
    if (initialTab === "interests" || initialTab === "club") {
      setSettingsTab(initialTab);
    }
  }, [initialTab]);

  const segmentBtn = (id, label) => {
    const active = settingsTab === id;
    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setSettingsTab(id)}
        style={{
          flex: 1,
          minHeight: 40,
          border: "none",
          borderRadius: radius.lg,
          cursor: "pointer",
          background: active ? glass.fillHeavy : "transparent",
          color: active ? color.ink : color.muted,
          boxShadow: active ? `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}` : "none",
          fontSize: 14,
          fontWeight: active ? 700 : 550,
          fontFamily: fontDisplay,
          letterSpacing: -0.1,
          textTransform: "uppercase",
          transition: `background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease}`,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ padding: "0 0 28px" }}>
      <CollapsingHeader
        title="Club"
        subtitle={settingsTab === "interests" ? "Settings · Your interests" : CLUB_TAGLINE}
      />

      <div style={{ padding: `12px ${homeSpace.gutter}px 0` }}>
        {/* Settings tabs */}
        <div
          role="tablist"
          aria-label="Club settings"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            marginBottom: 18,
            borderRadius: radius.lg,
            border: `1px solid ${glass.border}`,
            background: `
              linear-gradient(165deg, rgba(32,36,43,0.65) 0%, rgba(28,32,38,0.4) 100%)
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
            backdropFilter: glass.blurSoft,
            WebkitBackdropFilter: glass.blurSoft,
          }}
        >
          {SETTINGS_TABS.map((t) => segmentBtn(t.id, t.label))}
        </div>

        {settingsTab === "interests" ? (
          <InterestsPanel
            tracks={tracks}
            genres={user.genres || profile?.genres || []}
            adventurous={profile?.adventurous ?? TASTE_AXIS_DEFAULT}
            depth={profile?.depth ?? TASTE_AXIS_DEFAULT}
            recentTracks={recentTracks}
            signalLabel={signalLabel}
            onEditGenres={onEditGenres}
            onPlayTrack={onPlayTrack}
            showIntro
          />
        ) : (
          <>
        {/* Collectible membership card */}
        <div
          role="group"
          aria-label={`${CLUB_NAME} membership card`}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius.xl,
            padding: "26px 22px 24px",
            marginBottom: 22,
            border: `1px solid ${glass.border}`,
            background: glass.plate,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            boxShadow: `
              inset 0 1px 0 ${glass.highlight},
              inset 0 -1px 0 rgba(26,29,36,0.04),
              ${glass.shadowLift}
            `,
            animation: `rise 0.55s ${motion.ease} both`,
          }}
        >
          {/* Vinyl groove rings — record club stamp */}
          <div aria-hidden="true" style={{
            position: "absolute",
            right: -36,
            top: -42,
            width: 188,
            height: 188,
            borderRadius: "50%",
            border: `1px solid ${glass.borderSoft}`,
            boxShadow: `
              inset 0 0 0 14px rgba(26,29,35,0.45),
              inset 0 0 0 28px rgba(190,198,210,0.12),
              inset 0 0 0 42px rgba(255,255,255,0.25),
              inset 0 0 0 56px rgba(190,198,210,0.1)
            `,
            pointerEvents: "none",
            opacity: 0.9,
          }} />
          <div aria-hidden="true" style={{
            position: "absolute",
            right: 42,
            top: 36,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `
              radial-gradient(circle at 35% 30%, #F7F8FA 0%, #C5CAD3 45%, #8B929E 100%)
            `,
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12)`,
            pointerEvents: "none",
          }} />

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            position: "relative",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DoorGlyph size={28} title="Planet MP3" />
              <div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 2.4,
                  textTransform: "uppercase",
                  color: color.ink,
                  fontFamily: fontMono,
                }}>
                  {CLUB_NAME}
                </div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.6,
                  color: color.muted,
                  marginTop: 2,
                  fontFamily: fontMono,
                }}>
                  {CLUB_TAGLINE}
                </div>
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${glass.borderSoft}`,
              background: "rgba(38,43,51,0.8)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: hasCard ? color.accent : color.muted,
              fontFamily: fontMono,
            }}>
              {tier === PLAN_IDS.PREMIUM ? "Premium" : hasCard ? "Club" : "Free"}
            </div>
          </div>

          <div style={{
            fontSize: "clamp(28px, 7vw, 36px)",
            fontWeight: 700,
            letterSpacing: -1,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.05,
            marginBottom: 8,
            position: "relative",
          }}>
            {user.name}
          </div>

          {/* Embossed serial plate */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            marginBottom: 20,
            borderRadius: 8,
            border: `1px solid ${glass.border}`,
            background: `
              linear-gradient(180deg, rgba(56,62,72,0.95) 0%, rgba(232,236,242,0.9) 100%)
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            position: "relative",
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: color.muted,
              fontFamily: fontMono,
            }}>
              No.
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 650,
              letterSpacing: 1.2,
              fontFamily: fontMono,
              color: color.accent,
              fontVariantNumeric: "tabular-nums",
            }}>
              {memberNumberLabel(memberNo || 0).replace(/^Member\s+/i, "")}
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            paddingTop: 16,
            borderTop: `1px solid ${glass.borderSoft}`,
            position: "relative",
          }}>
            <div>
              <div style={fieldLabel}>Joined</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: color.ink, fontFamily: fontDisplay }}>
                {joined}
              </div>
            </div>
            <div>
              <div style={fieldLabel}>On the shelf</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: color.ink, lineHeight: 1.35 }}>
                <div>{stats.albums} Album{stats.albums === 1 ? "" : "s"}</div>
                <div>{stats.eps} EP{stats.eps === 1 ? "" : "s"}</div>
                <div>{stats.singles} Single{stats.singles === 1 ? "" : "s"}</div>
              </div>
            </div>
          </div>

          {curatorBadge && (
            <div style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${glass.borderSoft}`,
              fontSize: 13,
              color: color.body,
              lineHeight: 1.4,
              position: "relative",
            }}>
              Featured curator · {formatMonthLabel(curatorBadge)}
            </div>
          )}
        </div>

        {/* Floor phase — record club “what’s on” */}
        <div style={{
          marginBottom: 26,
          padding: "14px 16px",
          borderRadius: radius.lg,
          border: `1px solid ${glass.borderSoft}`,
          background: glass.plate,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
          backdropFilter: glass.blurSoft,
          WebkitBackdropFilter: glass.blurSoft,
          animation: `rise 0.55s ${motion.ease} 0.06s both`,
        }}>
          <div style={{
            ...fieldLabel,
            marginBottom: 6,
            color: color.accent,
          }}>
            {floor.label} · listening hours
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: color.ink,
            fontFamily: fontDisplay,
            letterSpacing: -0.2,
            marginBottom: 4,
          }}>
            The booth is open
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45 }}>
            {floor.blurb}{" "}
            {hasCard
              ? "Your membership keeps the crate unlocked."
              : playsLabel
                ? `${playsLabel}.`
                : `Free plan · ${BILLING.freePlaysPerDay} plays/day.`}
          </div>
          {!hasCard && (
            <div style={{ marginTop: 12 }}>
              <FreePlaysMeter
                remaining={playsLeft}
                access={access}
                onUpgrade={onOpenPlans || (onSubscribe ? () => onSubscribe() : null)}
              />
            </div>
          )}
        </div>

        <CollectorPanel
          tracks={tracks}
          collection={profile?.collection}
          memberPricing={hasCard}
        />

        {/* This month’s pressing */}
        {communityMix && onOpenMix && (
          <button
            type="button"
            onClick={onOpenMix}
            style={{
              width: "100%",
              textAlign: "left",
              marginBottom: 26,
              padding: 0,
              border: `1px solid rgba(255,255,255,0.14)`,
              borderRadius: radius.xl,
              overflow: "hidden",
              cursor: "pointer",
              background: `
                linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.5) 100%)
              `,
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
              backdropFilter: glass.blur,
              WebkitBackdropFilter: glass.blur,
              animation: `rise 0.55s ${motion.ease} 0.1s both`,
            }}
          >
            <div style={{ padding: "16px 18px 14px" }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: color.muted,
                fontFamily: fontMono,
                marginBottom: 8,
              }}>
                This month’s pressing
              </div>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: -0.5,
                fontFamily: fontDisplay,
                color: color.ink,
                lineHeight: 1.15,
                marginBottom: 6,
              }}>
                {communityMix.title || "Community Mix"}
              </div>
              <div style={{ fontSize: 13, color: color.body, lineHeight: 1.4 }}>
                {mixCurator
                  ? `Curated by ${mixCurator} · ${mixCount} cut${mixCount === 1 ? "" : "s"}`
                  : `${mixCount} cut${mixCount === 1 ? "" : "s"} · for every member`}
              </div>
            </div>
            <div style={{
              padding: "11px 18px",
              background: "rgba(27,31,37,0.52)",
              borderTop: `1px solid ${glass.borderSoft}`,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: color.body,
              fontFamily: fontMono,
            }}>
              Open the plate →
            </div>
          </button>
        )}

        {/* Membership privileges */}
        <section style={{ marginBottom: 26 }}>
          <div style={sectionLabel}>Member privileges</div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {privileges.map((p, i) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "12px 14px",
                  marginBottom: 6,
                  borderRadius: radius.lg,
                  background: `
                    linear-gradient(165deg, rgba(32,36,43,0.68) 0%, rgba(28,32,38,0.38) 100%)
                  `,
                  border: `1px solid ${glass.borderSoft}`,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                  backdropFilter: glass.blurSoft,
                  WebkitBackdropFilter: glass.blurSoft,
                }}
              >
                <span style={{
                  width: 22,
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: fontMono,
                  color: color.accent,
                  letterSpacing: 0.4,
                  paddingTop: 2,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 650,
                    color: color.ink,
                    fontFamily: fontDisplay,
                    letterSpacing: -0.2,
                    marginBottom: 2,
                  }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 13, color: color.body, lineHeight: 1.4 }}>
                    {p.blurb}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 26 }}>
          <div style={sectionLabel}>Membership</div>
          <div style={{ fontSize: 15, color: color.body, lineHeight: 1.45, marginBottom: 6 }}>
            {memberLine}
          </div>
          <div style={{ fontSize: 14, color: color.muted, lineHeight: 1.45, marginBottom: 8 }}>
            {tier === PLAN_IDS.PREMIUM
              ? `Premium · ${formatPricePremium()}. ${creditLine} — spend when Club Copy buying opens.`
              : tier === PLAN_IDS.CLUB || access?.reason === "trial"
                ? `Club · ${formatPriceClub()}. Premium adds Club Credit for when editions open.`
                : `Free · limited streaming. Club is ${formatPriceClub()}. Premium is ${formatPricePremium()}.`}
          </div>
          {tier === PLAN_IDS.PREMIUM && (
            <div style={{ fontSize: 13, color: color.body, marginBottom: 14, lineHeight: 1.4 }}>
              {creditLine}
            </div>
          )}
          {(access?.canUpgradeClub || access?.canUpgradePremium) && (onOpenPlans || onSubscribe) && (
            <button
              type="button"
              onClick={() => (onOpenPlans ? onOpenPlans() : onSubscribe?.())}
              style={{
                ...BTN_PRIMARY,
                width: "100%",
                borderRadius: 980,
                marginBottom: 4,
              }}
            >
              {access?.canUpgradeClub ? `Join Club — ${formatPriceClub()}` : `Go Premium — ${formatPricePremium()}`}
            </button>
          )}
        </section>

        <button
          type="button"
          onClick={onLogout}
          style={{ ...BTN_SECONDARY, width: "100%", borderRadius: 980 }}
        >
          Sign Out
        </button>
          </>
        )}
      </div>
    </div>
  );
}

const fieldLabel = {
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: color.muted,
  fontFamily: fontMono,
  marginBottom: 6,
};

const sectionLabel = {
  fontSize: 12,
  fontWeight: 650,
  color: color.muted,
  textTransform: "uppercase",
  letterSpacing: 1.1,
  fontFamily: fontMono,
  marginBottom: 12,
};
