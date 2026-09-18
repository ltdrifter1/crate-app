/** Soft groove progress under desktop now-playing art — store-subscribed. */
import { color, glass } from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";

export default function PlaybackProgressHairline() {
  const { progress, duration } = usePlayerPlayback();
  const pct = duration ? (progress / duration) * 100 : 0;
  return (
    <div style={{
      height: 4,
      background: "rgba(232,234,238,0.10)",
      marginBottom: 16,
      overflow: "hidden",
      position: "relative",
      borderRadius: 2,
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.45)",
      border: `1px solid ${glass.borderSoft}`,
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: `
          linear-gradient(90deg, rgba(30,111,232,0.65) 0%, #1E6FE8 100%)
        `,
        boxShadow: "0 0 8px rgba(30,111,232,0.35)",
        transition: "width 1s linear",
        borderRadius: 2,
      }} />
    </div>
  );
}
