import { formatTrackMeta } from "./DeviceLcd";

test("formatTrackMeta prints BPM, key, energy", () => {
  expect(formatTrackMeta({
    bpm: 124.4,
    camelot: "8A",
    energy: 7,
  })).toEqual(["124 BPM", "8A", "E7"]);
});

test("formatTrackMeta skips empty fields and keeps extras", () => {
  expect(formatTrackMeta({ title: "x" }, ["PLANET / 003"])).toEqual(["PLANET / 003"]);
});
