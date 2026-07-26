import { font, fontMono, color } from "../../theme";
import { activeBrandDirection, BRAND_TAGLINE } from "../../brand/identity";

/** Shared tagline lockup — YOUR WORLD, YOUR MUSIC. */
export default function BrandTagline({
  text = BRAND_TAGLINE,
  light = false,
  style = {},
  size,
}) {
  const dir = activeBrandDirection();
  const ink = light ? color.onDarkMuted : color.body;
  const fs = size || dir.tagline.size;
  const family = dir.tagline.font === "mono" ? fontMono : font;

  return (
    <p
      style={{
        margin: 0,
        fontSize: fs,
        lineHeight: 1.45,
        color: ink,
        fontFamily: family,
        fontWeight: 600,
        letterSpacing: dir.tagline.letterSpacing,
        textTransform: dir.tagline.transform,
        maxWidth: 360,
        ...style,
      }}
    >
      {text}
    </p>
  );
}
