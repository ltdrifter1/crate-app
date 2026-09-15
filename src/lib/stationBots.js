/**
 * Station room bots — two human-sounding listeners so Home chat never feels empty.
 * Client-side only. Never written to Firestore.
 */

export const STATION_BOTS = [
  {
    uid: "bot-rio",
    displayName: "Rio",
    color: "#9FD6EE",
    lines: [
      "this is the one i needed tonight",
      "windows down even if it's cold, idc",
      "okay who queued this because thank you",
      "i'm not skipping this, sorry",
      "lowkey the best thing on right now",
      "this transition was criminal",
      "anyone else just sitting in the car still",
      "yeah i'm leaving this on",
      "the mix is actually locked in",
    ],
  },
  {
    uid: "bot-sable",
    displayName: "Sable",
    color: "#C5E4F4",
    lines: [
      "rain + this track. that's the whole show",
      "local hour going crazy",
      "giving this a full listen, don't talk to me",
      "the drums on this are so clean",
      "yeah i'm staying on this channel",
      "this one feels like the ferry at night",
      "alright i'll allow it",
      "quiet flex from whoever programmed this",
      "don't change it",
    ],
  },
];

export function botPresence(now = Date.now()) {
  return STATION_BOTS.map((bot) => ({
    uid: bot.uid,
    displayName: bot.displayName,
    color: bot.color,
    lastSeen: now,
    bot: true,
  }));
}

export function trackAwareLines(nowPlaying) {
  const title = String(nowPlaying?.title || "").trim();
  if (!title) return [];
  const short = title.length > 28 ? `${title.slice(0, 26)}…` : title;
  return [
    `hold up — ${short} just hit`,
    `leaving ${short} on, don't judge`,
    `this ${short} part though`,
  ];
}

export function nextBotLine(bot, lastText = "", nowPlaying = null, rng = Math.random) {
  const pool = [...(bot?.lines || [])];
  if (nowPlaying?.title && rng() < 0.32) {
    pool.push(...trackAwareLines(nowPlaying));
  }
  const filtered = pool.filter((line) => line && line !== lastText);
  const source = filtered.length ? filtered : pool;
  if (!source.length) return "this is nice";
  return source[Math.floor(rng() * source.length)];
}

export function seedBotThread(nowPlaying = null, now = Date.now()) {
  const rio = STATION_BOTS[0];
  const sable = STATION_BOTS[1];
  return [
    {
      id: "bot-seed-1",
      uid: rio.uid,
      displayName: rio.displayName,
      text: "this is the one i needed tonight",
      createdAt: now - 210_000,
      clientId: "bot-seed-1",
      bot: true,
    },
    {
      id: "bot-seed-2",
      uid: sable.uid,
      displayName: sable.displayName,
      text: "yeah i'm staying on this channel",
      createdAt: now - 96_000,
      clientId: "bot-seed-2",
      bot: true,
    },
    {
      id: "bot-seed-3",
      uid: rio.uid,
      displayName: rio.displayName,
      text: nowPlaying?.title ? `leaving ${nowPlaying.title} on, don't judge` : "yeah i'm leaving this on",
      createdAt: now - 22_000,
      clientId: "bot-seed-3",
      bot: true,
    },
  ];
}

export function buildBotMessage(bot, text, now = Date.now(), nowPlaying = null) {
  const clientId = `bot-${bot.uid}-${now.toString(36)}`;
  return {
    id: clientId,
    uid: bot.uid,
    displayName: bot.displayName,
    text,
    createdAt: now,
    clientId,
    bot: true,
    trackTitle: nowPlaying?.title ? String(nowPlaying.title).slice(0, 80) : null,
  };
}

export function mergePresence(real = [], bots = []) {
  const ids = new Set(real.map((p) => p?.uid).filter(Boolean));
  return [...real, ...bots.filter((p) => p?.uid && !ids.has(p.uid))];
}
