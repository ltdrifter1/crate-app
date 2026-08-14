import { color, fontDisplay, glassPill, y2k } from "../../theme";
import Icon from "../ui/Icon";
import CardContainer from "./CardContainer";

/**
 * RequestSongCard — frosted prompt that jumps to Search.
 */
export default function RequestSongCard({ onClick = null }) {
  return (
    <CardContainer
      interactive
      onClick={onClick}
      ariaLabel="Request a song — open search"
      padding="18px 18px"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: -0.25,
            color: y2k.offWhite,
          }}
        >
          Request a song
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: -0.05,
            color: color.muted,
          }}
        >
          What do you wanna hear?
        </div>
      </div>
      <span
        aria-hidden="true"
        style={{
          ...glassPill({ active: true, compact: true }),
          width: 44,
          height: 44,
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.34) 0%, transparent 42%),
            linear-gradient(160deg, #E8ECF2 0%, #B8C0CC 48%, #6E7683 100%)
          `,
          color: "#0B0C0F",
          border: "1px solid rgba(255,255,255,0.32)",
          boxShadow: `0 0 18px ${y2k.chromeGlow}, inset 0 1px 0 rgba(255,255,255,0.45)`,
        }}
      >
        <span style={{ display: "flex", marginLeft: 2 }}>
          <Icon name="play" size={15} />
        </span>
      </span>
    </CardContainer>
  );
}
