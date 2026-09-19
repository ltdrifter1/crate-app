import { color, y2k } from "../../theme";
import Icon from "./Icon";

/**
 * Steel disc plate — shown when a catalog photo is missing or failed.
 * Keeps Home tiles from going blank while covers retry / 404.
 */
export default function DefaultSleeve({ size = 48 }) {
  const icon = Math.max(18, Math.min(56, Math.round(Number(size) * 0.38) || 28));
  return (
    <span
      data-testid="cover-fallback"
      aria-hidden="true"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: y2k.artGradient,
        color: color.lcdInk,
      }}
    >
      <Icon name="disc" size={icon} />
    </span>
  );
}
