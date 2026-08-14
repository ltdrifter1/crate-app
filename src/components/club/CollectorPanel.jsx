/**
 * Collector status — complete the copy for artists with physical editions.
 */
import { useMemo } from "react";
import { fontDisplay, fontMono, color, radius, glass, motion } from "../../theme";
import { buildCollectorRows } from "../../lib/collections";
import { physicalStatusFor } from "../../lib/physicalStatus";

export default function CollectorPanel({
  tracks = [],
  collection = null,
  memberPricing = false,
}) {
  const rows = useMemo(
    () => buildCollectorRows(tracks, collection || {}, { limit: 6 }),
    [tracks, collection]
  );

  if (!rows.length) {
    return (
      <section style={{ marginBottom: 26 }}>
        <div style={sectionLabel}>Your collection</div>
        <div style={{
          padding: "16px 18px",
          borderRadius: radius.lg,
          border: `1px solid ${glass.borderSoft}`,
          background: glass.plate,
          fontSize: 14,
          color: color.body,
          lineHeight: 1.45,
        }}>
          When Club Copy editions land, they show up here so you can finish an artist&apos;s set.
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: 26, animation: `rise 0.55s ${motion.ease} 0.12s both` }}>
      <div style={sectionLabel}>Complete the copy</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((row) => {
          const c = row.collector;
          const sample = row.tracks.find((t) => physicalStatusFor(t).id !== "digital") || row.tracks[0];
          const status = physicalStatusFor(sample);
          return (
            <div
              key={row.slug}
              style={{
                padding: "14px 16px",
                borderRadius: radius.lg,
                border: `1px solid ${glass.borderSoft}`,
                background: glass.plate,
                boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  letterSpacing: -0.3,
                }}>
                  {row.name}
                </div>
                <div style={{
                  fontSize: 11,
                  fontFamily: fontMono,
                  fontWeight: 700,
                  color: color.accent,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>
                  {c.owned}/{c.total}
                </div>
              </div>
              <div style={{ fontSize: 13, color: color.body, lineHeight: 1.4, marginBottom: 8 }}>
                {c.cta?.line || c.label}
                {memberPricing ? " · Club member pricing" : ""}
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: fontMono,
                color: color.faint,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}>
                Status · {status.label}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const sectionLabel = {
  fontSize: 12,
  fontWeight: 650,
  color: color.muted,
  textTransform: "uppercase",
  letterSpacing: 1.1,
  fontFamily: fontMono,
  marginBottom: 12,
};
