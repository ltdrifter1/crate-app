/**
 * Club — Digital Record Club membership home.
 * Collectible card, listening privileges, crate stats, Community Mix.
 */
import { useEffect, useMemo } from "react";
import {
  fontDisplay, fontMono, color, radius, glass, motion,
  BTN_PRIMARY, BTN_SECONDARY, homeSpace,
} from "../../theme";
import {
  membershipSummary,
  formatPriceMonthly,
} from "../../lib/entitlements";
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

let clubVisitedThisSession = false;

const PRIVILEGES = [
  {
    id: "crate",
    label: "The crate",
    blurb: "Full catalog · harmonic radio · listening booth",
  },
  {
    id: "pressings",
    label: "Your pressings",
    blurb: "Stacks, likes, and filed cuts stay with your number",
  },
  {
    id: "mix",
    label: "Community Mix",
    blurb: "One monthly plate pressed for every member",
  },
];

export default function ClubScreen({
  user,
  tracks,
  onLogout,
  onEditGenres = null,
  access = null,
  onSubscribe = null,
  profile = null,
  onOpenMix = null,
  communityMix = null,
}) {
  const liked = useMemo(() => tracks.filter((t) => t.liked), [tracks]);
  const genres = user.genres || [];
  const memberLine = membershipSummary(access);
  const price = formatPriceMonthly();
  const showSubscribe = access && !access.allowed;
  const onTrial = access?.reason === "trial";
  const stats = useMemo(() => collectionStats(liked), [liked]);
  const memberNo = profile?.memberNumber ?? user.memberNumber;
  const joined = formatJoinedMonth(profile?.createdAt || profile?.clubJoinedAt);
  const curatorBadge = profile?.featuredCuratorMonth || null;
  const floor = useMemo(() => getFloorPhase(), []);
  const mixCount = (communityMix?.trackIds || []).length;
  const mixCurator =
    communityMix?.featuredCurator?.displayName || communityMix?.ownerName || null;

  useEffect(() => {
    if (clubVisitedThisSession) return;
    clubVisitedThisSession = true;
    hapticTap(10);
  }, []);

  return (
    <div style={{ padding: "0 0 28px" }}>
      <CollapsingHeader
        title="Club"
        subtitle={CLUB_TAGLINE}
      />

      <div style={{ padding: `12px ${homeSpace.gutter}px 0` }}>
        {/* Collectible membership card */}
        <div
          role="group"
          aria-label={`${CLUB_NAME} membership card`}
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radius.lg,
            padding: "26px 22px 24px",
            marginBottom: 22,
            border: `1px solid ${glass.border}`,
            background: `
              radial-gradient(ellipse 100% 90% at 8% -10%, rgba(210,216,226,0.55) 0%, transparent 52%),
              radial-gradient(ellipse 70% 60% at 100% 110%, rgba(255,255,255,0.9) 0%, transparent 48%),
              linear-gradient(158deg, #FFFFFF 0%, #F3F5F8 48%, #E4E8EF 100%)
            `,
            boxShadow: `
              inset 0 1px 0 ${glass.highlight},
              inset 0 -1px 0 rgba(26,29,36,0.04),
              ${glass.shadow}
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
              inset 0 0 0 14px rgba(255,255,255,0.35),
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
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7)`,
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
              background: "rgba(255,255,255,0.7)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: color.accent,
              fontFamily: fontMono,
            }}>
              Member
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
              linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(232,236,242,0.9) 100%)
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
          borderRadius: radius.md,
          border: `1px solid ${glass.borderSoft}`,
          background: `
            linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(240,243,247,0.85) 100%)
          `,
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
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
            {floor.blurb} Your membership keeps the crate unlocked.
          </div>
        </div>

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
              border: `1px solid ${glass.border}`,
              borderRadius: radius.lg,
              overflow: "hidden",
              cursor: "pointer",
              background: color.ink,
              boxShadow: glass.shadowSoft,
              animation: `rise 0.55s ${motion.ease} 0.1s both`,
            }}
          >
            <div style={{ padding: "16px 18px 14px" }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: "rgba(244,246,249,0.55)",
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
                color: color.onDark,
                lineHeight: 1.15,
                marginBottom: 6,
              }}>
                {communityMix.title || "Community Mix"}
              </div>
              <div style={{ fontSize: 13, color: "rgba(244,246,249,0.72)", lineHeight: 1.4 }}>
                {mixCurator
                  ? `Curated by ${mixCurator} · ${mixCount} cut${mixCount === 1 ? "" : "s"}`
                  : `${mixCount} cut${mixCount === 1 ? "" : "s"} · for every member`}
              </div>
            </div>
            <div style={{
              padding: "11px 18px",
              background: "rgba(255,255,255,0.06)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "rgba(244,246,249,0.85)",
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
            {PRIVILEGES.map((p, i) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "12px 0",
                  borderTop: i === 0 ? `1px solid ${glass.borderSoft}` : undefined,
                  borderBottom: `1px solid ${glass.borderSoft}`,
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
          <div style={{ fontSize: 14, color: color.muted, lineHeight: 1.45, marginBottom: 14 }}>
            {access?.reason === "subscribed"
              ? `Full access · ${price}/month.`
              : onTrial
                ? `Free for your first month, then ${price}/month.`
                : access?.reason === "admin"
                  ? "Admin — full access."
                  : `Subscribe for ${price}/month to keep listening.`}
          </div>
          {(showSubscribe || onTrial) && onSubscribe && (
            <button
              type="button"
              onClick={onSubscribe}
              style={{
                ...(showSubscribe ? BTN_PRIMARY : BTN_SECONDARY),
                width: "100%",
                borderRadius: 980,
                marginBottom: 4,
              }}
            >
              {showSubscribe ? `Subscribe — ${price}/mo` : `Subscribe early — ${price}/mo`}
            </button>
          )}
        </section>

        <section style={{ marginBottom: 26 }}>
          <div style={sectionLabel}>Your interests</div>
          <div style={{ fontSize: 15, color: color.body, lineHeight: 1.45, marginBottom: 14 }}>
            {genres.length
              ? genres.join(" · ")
              : "Not set yet. Shape the crate to your taste anytime."}
          </div>
          {onEditGenres && (
            <button
              type="button"
              onClick={onEditGenres}
              style={{
                ...BTN_SECONDARY,
                width: "100%",
                borderRadius: 980,
                marginBottom: 4,
              }}
            >
              Edit interests
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
