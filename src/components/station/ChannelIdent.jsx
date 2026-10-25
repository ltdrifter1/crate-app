import { fontPoster, mtv } from "../../theme";
import { onInk } from "../../lib/mtvChannel";

/**
 * CH plate. On a tuned station it is printed in that station's ink — the same colour as its
 * card on the dial — so Home says which channel you are on. The live feed keeps the white sticker.
 */
export default function ChannelIdent({ bugLine, slug, ink = null }) {
  const plate = ink || mtv.plate;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 2,
        border: `1px solid ${plate}`,
        background: "rgba(0,0,0,0.55)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "5px 9px",
          fontFamily: fontPoster,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: mtv.caps,
          color: ink ? onInk(ink) : mtv.plateInk,
          background: plate,
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "5px 10px",
          fontFamily: fontPoster,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: mtv.caps,
          textTransform: "uppercase",
          color: mtv.plate,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {slug}
      </span>
    </span>
  );
}

