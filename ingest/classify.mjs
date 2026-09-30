// Uses the app's own channel rules (ingest/app-lib, synced from the app repo).
//   node ingest/classify.mjs --list          -> channel list (id, num, title, batch prefix)
//   echo '[{track}, ...]' | node ingest/classify.mjs  -> [[channelId, ...], ...]
import fs from "node:fs";
import {
  SCENE_CHANNELS, CHANNEL_BATCH_PREFIXES, trackMatchesChannel,
} from "./app-lib/sceneChannels.mjs";
import { inferScene } from "./app-lib/scenes.mjs";
import { normalizeGenre } from "./app-lib/genres.mjs";

export function batchPrefix(channel) {
  const p = (CHANNEL_BATCH_PREFIXES[channel.id] || [])[0];
  if (!p) return `${channel.id}-wave`;
  return p.includes("wave") ? p : `${p}-wave`;
}

export function channelList() {
  return SCENE_CHANNELS.map((c) => ({
    id: c.id, num: c.num, title: c.title, batchPrefix: batchPrefix(c),
    // channels that only match by batch name, never by genre/scene
    batchOnly: c.id === "local-pnw",
  }));
}

export function classify(tracks) {
  return tracks.map((t) => {
    const track = { audioUrl: "x", duration: 0, ...t };
    const ids = SCENE_CHANNELS.filter((c) => trackMatchesChannel(track, c)).map((c) => c.id);
    const scene = inferScene(track);
    return { channels: ids, scene: scene ? scene.id : null, lane: normalizeGenre(track.genre) || "" };
  });
}

if (process.argv[1] && process.argv[1].endsWith("classify.mjs")) {
  if (process.argv.includes("--list")) {
    console.log(JSON.stringify(channelList()));
  } else {
    const input = JSON.parse(fs.readFileSync(0, "utf8").replace(/^\uFEFF/, ""));
    console.log(JSON.stringify(classify(input)));
  }
}

