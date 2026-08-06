/** Soft groove progress under desktop now-playing art — store-subscribed. */
import { color, glass } from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";

export default function PlaybackProgressHairline() {
  const { progress, duration } = usePlayerPlayback();
  const pct = duration ? (progress / duration) * 100 : 0;
  return (
    <div style={{
      height: 5,
      background: `
        linear-gradient(180deg, rgba(18,20,26,0.1) 0%, rgba(255,255,255,0.45) 100%)
      `,
      marginBottom: 16,
      overflow: "hidden",
      position: "relative",
      borderRadius: 999,
      boxShadow: "inset 0 1px 2px rgba(18,20,26,0.12)",
      border: `1px solid ${glass.borderSoft}`,
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: `
          linear-gradient(180deg, #3A404C 0%, #1A1D24 55%, #2A2E38 100%)
        `,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
        transition: "width 1s linear",
        borderRadius: 999,
      }} />
    </div>
  );
}
