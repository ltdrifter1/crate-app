/**
 * Dev-only onboarding preview — hash #onboarding-preview.
 * Walk the tuner without Firebase, then land on Home with that taste bag.
 */
import { useMemo, useState } from "react";
import TasteTuner from "../components/onboarding/TasteTuner";
import HomeScreen from "../screens/HomeScreen";
import { makeSetPreviewCatalog } from "./SetPreview";
import { previewSleeve } from "./sleeves";
import { color, fontDisplay, fontMono, y2k } from "../theme";
import { tasteProfileBlurb } from "../lib/tasteProfile";
import { playerTransportStore } from "../lib/playerTransportStore";

function metalHeavyCatalog() {
  const base = makeSetPreviewCatalog();
  const extras = [
    { id: "metal-a", title: "Iron Lung", artist: "Foundry", genre: "Metal", energy: 9, playCount: 4, albumCover: previewSleeve("metal-a", "Gain"), duration: 210, audioUrl: "u" },
    { id: "metal-b", title: "Slag", artist: "Blast Radius", genre: "Metal", energy: 8, playCount: 2, albumCover: previewSleeve("metal-b", "Gain"), duration: 198, audioUrl: "u" },
    { id: "metal-c", title: "Riff City", artist: "Foundry", genre: "Metal", energy: 9, playCount: 6, albumCover: previewSleeve("metal-c", "Unpolished"), duration: 188, audioUrl: "u" },
    { id: "metal-d", title: "Pit", artist: "Low Gain", genre: "Metal", energy: 7, playCount: 1, albumCover: previewSleeve("metal-d", "Gain"), duration: 240, audioUrl: "u" },
    { id: "jazz-hit", title: "Blue Room", artist: "Sol Park", genre: "Jazz", energy: 3, playCount: 90, likeCount: 20, albumCover: previewSleeve("jazz-hit", "Quiet"), duration: 200, audioUrl: "u" },
    { id: "pop-hit", title: "Millennium", artist: "Gridlock", genre: "Pop", energy: 6, playCount: 140, likeCount: 40, albumCover: previewSleeve("pop-hit", "Y2K"), duration: 176, audioUrl: "u" },
  ];
  return [...extras, ...base];
}

export default function OnboardingPreview() {
  const tracks = useMemo(() => metalHeavyCatalog(), []);
  const [taste, setTaste] = useState(null);

  if (!taste) {
    return (
      <TasteTuner
        tracks={tracks}
        onComplete={(bag) => {
          const seed = tracks.find((t) => t.genre === "Metal") || tracks[0];
          playerTransportStore.sync({
            track: seed,
            isPlaying: true,
            isBuffering: false,
          });
          setTaste(bag);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: color.canvas }}>
      <div
        style={{
          padding: "14px 20px 0",
          fontFamily: fontMono,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: y2k.cyan,
        }}
      >
        Seeded · {tasteProfileBlurb(taste)} · {taste.seedChannelId}
      </div>
      <div
        style={{
          padding: "6px 20px 8px",
          fontFamily: fontDisplay,
          fontSize: 13,
          color: color.muted,
        }}
      >
        First session should lead with your station — not the global hit.
      </div>
      <HomeScreen
        tracks={tracks}
        taste={taste}
        userKey="preview-fresh"
        recentTrackIds={[]}
        sceneChannelsActiveId={taste.seedChannelId}
        onTuneSceneChannel={() => {}}
        onPlayTrack={() => {}}
        onPlayRadio={() => {}}
      />
    </div>
  );
}
