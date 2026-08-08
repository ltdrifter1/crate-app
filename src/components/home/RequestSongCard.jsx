import { color, fontDisplay, y2k } from "../../theme";
import Icon from "../ui/Icon";
import CardContainer from "./CardContainer";

/**
 * RequestSongCard — "what do you wanna hear?" prompt that jumps to Search.
 */
export default function RequestSongCard({ onClick = null }) {
  return (
    <CardContainer
      interactive
      onClick={onClick}
      ariaLabel="Request a song — open search"
      padding="20px 20px"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: `
          radial-gradient(110% 120% at 100% 0%, ${y2k.purpleWash} 0%, transparent 55%),
          linear-gradient(165deg, ${y2k.charcoalRaised} 0%, #101116 100%)
        `,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 17,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: y2k.offWhite,
          }}
        >
          Request a song
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 13,
            fontWeight: 500,
            color: color.muted,
          }}
        >
          What do you wanna hear?
        </div>
      </div>
      <span
        aria-hidden="true"
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, ${y2k.purpleBright} 0%, ${y2k.purple} 48%, ${y2k.purpleDeep} 100%)`,
          border: "1px solid rgba(255,255,255,0.22)",
          color: "#FFFFFF",
          boxShadow: `0 0 20px ${y2k.purpleGlow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
      >
        <span style={{ display: "flex", marginLeft: 2 }}>
          <Icon name="play" size={16} />
        </span>
      </span>
    </CardContainer>
  );
}
