/**
 * Dev-only mix booth preview — hash #set-preview.
 */
import SetBuilderScreen from "../components/set/SetBuilderScreen";
import { CANONICAL_GENRES } from "../lib/genres";
import { CHANNEL_ART } from "../lib/channelArt";

const COVERS = Object.values(CHANNEL_ART);

export function makeSetPreviewCatalog() {
  return Array.from({ length: 48 }, (_, i) => ({
    id: `set-prev-${i}`,
    title: [
      "Night Drive", "Cascade", "Iron Lung", "Haze", "Millennium",
      "After Hours", "Low Light", "Signal", "Booth Two", "Warm Up",
    ][i % 10] + (i >= 10 ? ` ${Math.floor(i / 10) + 1}` : ""),
    artist: ["Signal", "Rain City", "Foundry", "Sol Park", "Low Light"][i % 5],
    albumCover: COVERS[i % COVERS.length],
    duration: 160 + (i % 8) * 17,
    energy: (i % 10) + 1,
    camelot: `${(i % 12) + 1}A`,
    genre: CANONICAL_GENRES[i % CANONICAL_GENRES.length],
    audioUrl: "u",
    color: "#B8F24A",
  }));
}

export default function SetPreview() {
  return (
    <SetBuilderScreen
      tracks={makeSetPreviewCatalog()}
      initialActivity="night"
      intentLabel="Preview"
      onClose={() => {
        if (typeof window !== "undefined") window.location.hash = "";
      }}
      onPlayRoute={() => {}}
      onSavePlaylist={() => {}}
    />
  );
}
