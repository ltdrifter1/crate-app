/**
 * On air now — what each Channel Surfing dial is spinning this minute.
 *
 * Channels are client-side rotations, so "now" is a deterministic pick from
 * the channel pool per clock slot: every visitor sees the same cut on a dial
 * for the same few minutes, and tuning in starts exactly that cut.
 */
import { hasPlayableAudio } from "./audioUnlock";
import { hashSeed } from "./hashSeed";
import { buildSceneChannelPool } from "./sceneChannels";

/** One rotation slot — roughly a single. */
export const ON_AIR_SLOT_MS = 4 * 60 * 1000;

export function onAirSlot(now = Date.now()) {
  return Math.floor(now / ON_AIR_SLOT_MS);
}

/** Ms until the next slot flips (min 1s so timers never spin). */
export function msUntilNextSlot(now = Date.now()) {
  return Math.max(1000, ON_AIR_SLOT_MS - (now % ON_AIR_SLOT_MS));
}

/** Stable, id-ordered rotation for one channel: playable cuts, sleeves first. */
export function onAirRotation(tracks = [], channel) {
  if (!channel) return [];
  const playable = buildSceneChannelPool(tracks, channel).filter(
    (t) => t?.id && hasPlayableAudio(t) && !t.disliked
  );
  const sleeved = playable.filter((t) => t.albumCover);
  const list = sleeved.length ? sleeved : playable;
  return list.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export function pickOnAir(rotation = [], channelId = "", slot = onAirSlot()) {
  if (!rotation.length) return null;
  return rotation[hashSeed(`${channelId}:${slot}`) % rotation.length];
}

/** { [channelId]: rotation[] } for a set of dials. */
export function buildOnAirRotations(tracks = [], channels = []) {
  const out = {};
  for (const channel of channels) {
    if (channel?.id) out[channel.id] = onAirRotation(tracks, channel);
  }
  return out;
}

/** { [channelId]: track } for one slot. */
export function onAirNow(rotations = {}, slot = onAirSlot()) {
  const out = {};
  for (const id of Object.keys(rotations)) {
    const track = pickOnAir(rotations[id], id, slot);
    if (track) out[id] = track;
  }
  return out;
}
