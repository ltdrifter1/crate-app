/** Hairline progress under desktop now-playing art — store-subscribed. */
import { color } from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";

export default function PlaybackProgressHairline() {
  const { progress, duration } = usePlayerPlayback();
  const pct = duration ? (progress / duration) * 100 : 0;
  return (
    <div style={{
      height: 4,
      background: "rgba(26,29,36,0.1)",
      marginBottom: 16,
      overflow: "hidden",
      position: "relative",
      borderRadius: 2,
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: color.accent,
        transition: "width 1s linear",
        borderRadius: 2,
      }} />
    </div>
  );
}
