import {
  STATION_BOTS,
  botPresence,
  buildBotMessage,
  mergePresence,
  nextBotLine,
  seedBotThread,
  trackAwareLines,
} from "./stationBots";

describe("station bots", () => {
  test("two human personas with lines", () => {
    expect(STATION_BOTS).toHaveLength(2);
    expect(STATION_BOTS.map((b) => b.displayName)).toEqual(["Rio", "Sable"]);
    expect(STATION_BOTS.every((b) => b.lines.length >= 6)).toBe(true);
  });

  test("seed thread is already talking", () => {
    const seed = seedBotThread({ title: "Night Drive" }, 1_000_000);
    expect(seed).toHaveLength(3);
    expect(seed.some((m) => m.uid === "bot-rio")).toBe(true);
    expect(seed.some((m) => m.uid === "bot-sable")).toBe(true);
    expect(seed[seed.length - 1].text.toLowerCase()).toMatch(/night drive|leaving/);
  });

  test("next line avoids the last text", () => {
    const bot = STATION_BOTS[0];
    const last = bot.lines[0];
    const line = nextBotLine(bot, last, null, () => 0);
    expect(line).not.toBe(last);
    expect(bot.lines).toContain(line);
  });

  test("track-aware lines mention the cut", () => {
    const lines = trackAwareLines({ title: "Cascade" });
    expect(lines.some((l) => l.includes("Cascade"))).toBe(true);
  });

  test("presence merge keeps real listeners first", () => {
    const real = [{ uid: "u1", displayName: "Luke", lastSeen: 1 }];
    const bots = botPresence(1);
    const merged = mergePresence(real, bots);
    expect(merged[0].uid).toBe("u1");
    expect(merged.map((p) => p.uid)).toEqual(["u1", "bot-rio", "bot-sable"]);
  });

  test("bot messages never look like system copy", () => {
    const msg = buildBotMessage(STATION_BOTS[1], "don't change it", 50, { title: "Rain City" });
    expect(msg.bot).toBe(true);
    expect(msg.text).toBe("don't change it");
    expect(msg.displayName).toBe("Sable");
    expect(msg.trackTitle).toBe("Rain City");
  });
});
