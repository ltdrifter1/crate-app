import { color, fontDisplay, radio, y2k } from "../../theme";
import Icon from "../ui/Icon";
import CardContainer from "./CardContainer";

/**
 * RequestSongCard — hardware prompt that jumps to Search.
 */
export default function RequestSongCard({ onClick = null }) {
  return (
    <CardContainer
      interactive
      onClick={onClick}
      ariaLabel="Request a song — open search"
      padding="16px 16px"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: "uppercase",
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
          width: 42,
          height: 42,
          borderRadius: radio.radiusControl,
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: radio.tuneFace,
          color: y2k.nearBlack,
          border: "1px solid rgba(255,255,255,0.28)",
          boxShadow: radio.tuneShadow,
        }}
      >
        <span style={{ display: "flex", marginLeft: 2 }}>
          <Icon name="play" size={15} />
        </span>
      </span>
    </CardContainer>
  );
}
