/**
 * Dev-only feature tour + Club guide preview.
 *   #guide-preview       — overlay tour, then Club → Guide
 *   #guide-preview-club  — Club Guide tab (static + replay)
 */
import { useState } from "react";
import FeatureTour from "../components/guide/FeatureTour";
import ClubScreen from "../components/club/ClubScreen";
import { color } from "../theme";

const PREVIEW_USER = { name: "Listener", genres: ["Electronic"], memberNumber: 98 };
const PREVIEW_PROFILE = {
  displayName: "Listener",
  memberNumber: 98,
  onboarded: true,
  tutorialSeen: true,
  featureGuideVersion: 1,
  adventurous: 40,
  depth: 50,
  recentTracks: [],
};

export default function GuidePreview() {
  const startOnClub =
    typeof window !== "undefined" && window.location.hash === "#guide-preview-club";
  const [phase, setPhase] = useState(startOnClub ? "club" : "tour");
  const [replay, setReplay] = useState(false);

  const showTour = phase === "tour" || replay;

  return (
    <div style={{ minHeight: "100dvh", background: color.canvas }}>
      {phase === "club" && (
        <ClubScreen
          user={PREVIEW_USER}
          tracks={[]}
          onLogout={() => {}}
          profile={PREVIEW_PROFILE}
          recentTracks={[]}
          initialTab="guide"
          onReplayTour={() => setReplay(true)}
        />
      )}
      {showTour && (
        <FeatureTour
          replay={replay}
          onComplete={() => {
            setReplay(false);
            setPhase("club");
          }}
          onSkip={() => {
            setReplay(false);
            setPhase("club");
          }}
        />
      )}
    </div>
  );
}
