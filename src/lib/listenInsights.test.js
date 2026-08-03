import { buildListenInsights, energyBandLabel } from "./listenInsights";

const sample = [
  { id: "a", title: "Alpha", artist: "A", genre: "Electronic", energy: 8, playCount: 12, likeCount: 4, liked: true, duration: 200 },
  { id: "b", title: "Beta", artist: "B", genre: "Jazz", energy: 3, playCount: 5, likeCount: 2, liked: true, duration: 210 },
  { id: "c", title: "Gamma", artist: "C", genre: "Electronic", energy: 7, playCount: 20, likeCount: 1, liked: false, duration: 180 },
];

describe("buildListenInsights", () => {
  test("summarizes genres, energy, and top lists", () => {
    const insight = buildListenInsights(sample, {
      genres: ["Electronic"],
      recentTracks: [{ trackId: "c" }, { trackId: "a" }],
      signalLabel: "Warming up",
    });
    expect(insight.preferred).toEqual(["Electronic"]);
    expect(insight.topPlayed[0].id).toBe("c");
    expect(insight.likedCount).toBe(2);
    expect(insight.genreMix[0].genre).toBe("Electronic");
    expect(insight.band.label).toBeTruthy();
    expect(insight.signalLabel).toBe("Warming up");
    expect(insight.coldStart).toBe(false);
  });

  test("cold start when no likes or recent", () => {
    const insight = buildListenInsights(
      [{ id: "x", title: "X", duration: 200, playCount: 9 }],
      { genres: [], recentTracks: [] }
    );
    expect(insight.coldStart).toBe(true);
    expect(insight.topPlayed).toHaveLength(0);
    expect(insight.leanLine).toMatch(/genres/i);
    expect(insight.leanLine).not.toMatch(/lane|signal|club/i);
  });

  test("preferred genres lean line stays plain", () => {
    const insight = buildListenInsights(
      [{ id: "x", title: "X", duration: 200 }],
      { genres: ["Jazz", "Soul"], recentTracks: [] }
    );
    expect(insight.leanLine).toMatch(/Your genres:/);
    expect(insight.leanLine).not.toMatch(/lane|signal|club/i);
  });

  test("energyBandLabel maps averages", () => {
    expect(energyBandLabel(2)).toMatch(/Calm/i);
    expect(energyBandLabel(9)).toMatch(/High energy/i);
  });
});
