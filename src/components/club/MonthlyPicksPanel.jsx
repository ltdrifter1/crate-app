/**
 * This month's picks — choose 1 of 3, or skip the month (positive option).
 */
import { useMemo, useState } from "react";
import {
  fontDisplay, fontMono, color, radius, glass, motion, BTN_PRIMARY, BTN_SECONDARY,
} from "../../theme";
import {
  buildMonthlyChoiceState,
  MONTHLY_CHOICE,
} from "../../lib/monthlyChoice";
import CoverImage from "../ui/CoverImage";

export default function MonthlyPicksPanel({
  tracks = [],
  profile = null,
  userKey = "",
  onPlayTrack = null,
  onEditTaste = null,
  onChoosePick = null,
  onSkipMonth = null,
  membershipOk = true,
}) {
  const slate = useMemo(
    () =>
      buildMonthlyChoiceState(tracks, profile, {
        limit: 3,
        userKey,
      }),
    [tracks, profile, userKey]
  );
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!slate.picks.length) return null;

  const choice = slate.choice;
  const pending = choice.status === MONTHLY_CHOICE.PENDING;
  const chosenTrack =
    choice.status === MONTHLY_CHOICE.CHOSEN
      ? slate.picks.find((p) => p.track.id === choice.trackId)?.track ||
        tracks.find((t) => t.id === choice.trackId)
      : null;

  async function choose() {
    if (!selectedId || !onChoosePick) return;
    setBusy(true);
    try {
      await onChoosePick(selectedId, slate.monthKey);
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    if (!onSkipMonth) return;
    setBusy(true);
    try {
      await onSkipMonth(slate.monthKey);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        marginBottom: 26,
        animation: `rise 0.55s ${motion.ease} 0.08s both`,
      }}
    >
      <div style={{
        fontSize: 12,
        fontWeight: 650,
        color: color.muted,
        textTransform: "uppercase",
        letterSpacing: 1.1,
        fontFamily: fontMono,
        marginBottom: 12,
      }}>
        This month&apos;s picks
      </div>
      <div
        style={{
          borderRadius: radius.xl,
          border: `1px solid ${glass.border}`,
          background: glass.plate,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 18px 10px" }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.5,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.15,
            marginBottom: 6,
          }}>
            {slate.monthLabel}
          </div>
          <div style={{ fontSize: 13, color: color.body, lineHeight: 1.4 }}>
            {!membershipOk
              ? "Club members choose one pick each month — or skip."
              : pending
                ? "Choose 1 to play and save — or skip this month. Nothing ships unless you choose."
                : choice.status === MONTHLY_CHOICE.SKIPPED
                  ? "You skipped this month. See you next month."
                  : "Your pick for this month."}
          </div>
        </div>

        {choice.status === MONTHLY_CHOICE.SKIPPED ? (
          <div style={{ padding: "8px 18px 18px", fontSize: 14, color: color.muted }}>
            Skipped · {slate.monthLabel}
          </div>
        ) : (
          <div style={{ padding: "4px 10px 12px" }} role="radiogroup" aria-label="Monthly picks">
            {slate.picks.map((pick, i) => {
              const t = pick.track;
              const selected =
                (pending && selectedId === t.id) ||
                (!pending && chosenTrack && chosenTrack.id === t.id);
              const disabled = !pending || !membershipOk;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={!!selected}
                  disabled={disabled && !onPlayTrack}
                  onClick={() => {
                    if (pending && membershipOk) setSelectedId(t.id);
                    else onPlayTrack?.(t, slate.picks.map((p) => p.track));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "10px 8px",
                    background: selected ? "rgba(169,199,228,0.08)" : "none",
                    border: "none",
                    borderRadius: radius.md,
                    cursor: "pointer",
                    textAlign: "left",
                    color: color.ink,
                    opacity: !pending && chosenTrack && chosenTrack.id !== t.id ? 0.45 : 1,
                  }}
                >
                  <span style={{
                    width: 22,
                    flexShrink: 0,
                    fontSize: 14,
                    color: selected ? color.accent : color.faint,
                  }} aria-hidden="true">
                    {pending ? (selected ? "●" : "○") : selected ? "✓" : String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    overflow: "hidden",
                    flexShrink: 0,
                    background: color.surfaceRaised,
                  }}>
                    {t.albumCover ? (
                      <CoverImage src={t.albumCover} width={44} height={44} alt="" draggable={false} />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: fontDisplay,
                        fontSize: 14,
                        fontWeight: 700,
                        color: color.faint,
                      }}>
                        {(t.title || "P")[0]}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 650,
                      fontFamily: fontDisplay,
                      letterSpacing: -0.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {t.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: color.muted,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {t.artist}
                      {pick.reason ? ` · ${pick.reason}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {pending && membershipOk && (
          <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              disabled={!selectedId || busy}
              onClick={choose}
              style={{
                ...BTN_PRIMARY,
                width: "100%",
                borderRadius: radius.md,
                opacity: !selectedId || busy ? 0.45 : 1,
                cursor: !selectedId || busy ? "default" : "pointer",
              }}
            >
              {busy ? "Saving…" : "Choose this pick"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={skip}
              style={{
                ...BTN_SECONDARY,
                width: "100%",
                borderRadius: radius.md,
              }}
            >
              Skip this month
            </button>
          </div>
        )}

        {!membershipOk && (
          <div style={{
            padding: "12px 18px",
            borderTop: `1px solid ${glass.borderSoft}`,
            fontSize: 13,
            color: color.body,
            lineHeight: 1.4,
          }}>
            Join Club to choose your monthly pick.
          </div>
        )}

        {onEditTaste && (
          <button
            type="button"
            onClick={onEditTaste}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 18px",
              background: "rgba(27,31,37,0.52)",
              border: "none",
              borderTop: `1px solid ${glass.borderSoft}`,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: color.body,
              fontFamily: fontMono,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Adjust taste →
          </button>
        )}
      </div>
    </section>
  );
}
