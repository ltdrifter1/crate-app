/**
 * Place atmosphere — continuous underlay for the ROOMS world.
 * Maps screen / room / booth state → CSS gradient + tone profile.
 */

import { timeOfDayGradient } from "../theme";
import { atmosphereGradient, allDestinationRooms, CULTURE_ROOMS } from "./rooms";
import { getFloorPhase, roomForFloorPhase, CLUB_ROOMS } from "./club";

const ROOM_LOOKUP = (() => {
  const map = {};
  [...CLUB_ROOMS, ...CULTURE_ROOMS, ...allDestinationRooms()].forEach((r) => {
    if (r?.id) map[r.id] = r;
  });
  return map;
})();

/** Soft track-colored wash for Booth. */
export function trackAtmosphere(track) {
  if (!track?.color) {
    return atmosphereGradient("night-fog");
  }
  // Approximate warm wash from hex — keep charcoal base
  return `radial-gradient(ellipse at 50% -10%, ${track.color}22 0%, #100E0C 42%, #0C0B0A 100%)`;
}

/**
 * Resolve the living atmosphere for the current place.
 * @returns {{ key: string, gradient: string, tone: 'dawn'|'day'|'dusk'|'night'|'floor'|'room'|'booth', energy: number }}
 */
export function resolvePlaceAtmosphere({
  screen = "home",
  roomId = null,
  track = null,
  immersive = false,
  listeningRoom = null,
} = {}) {
  const energy = track?.energy != null ? Number(track.energy) : 5;

  if (immersive && track) {
    return {
      key: `booth-${track.id}`,
      gradient: trackAtmosphere(track),
      tone: "booth",
      energy,
    };
  }

  if (screen === "rooms" && roomId) {
    const room = ROOM_LOOKUP[roomId];
    const atm = room?.atmosphere || roomId;
    return {
      key: `room-${roomId}`,
      gradient: atmosphereGradient(atm),
      tone: "room",
      energy: room?.avgEnergy ?? energy,
    };
  }

  if (screen === "rooms") {
    const floor = getFloorPhase();
    return {
      key: `floor-${floor.id}`,
      gradient: atmosphereGradient(floor.id),
      tone: "floor",
      energy: floor.id === "peak" ? 8 : floor.id === "closing" ? 3 : 5,
    };
  }

  if (screen === "favorites") {
    const floor = getFloorPhase();
    const label = roomForFloorPhase(floor.id);
    const club = CLUB_ROOMS.find((r) => r.label === label) || CLUB_ROOMS[0];
    return {
      key: `dig-${floor.id}`,
      gradient: atmosphereGradient(club.id || floor.id),
      tone: "floor",
      energy: 6,
    };
  }

  if (screen === "home") {
    return {
      key: "home-tod",
      gradient: timeOfDayGradient(),
      tone: hourTone(),
      energy: 4,
    };
  }

  if (screen === "paths") {
    return {
      key: "paths",
      gradient: atmosphereGradient("tube-hum"),
      tone: "dusk",
      energy: 5,
    };
  }

  if (screen === "artist" || screen === "album") {
    return {
      key: screen,
      gradient: atmosphereGradient(listeningRoom?.atmosphere || "amber-lamp"),
      tone: "room",
      energy: 4,
    };
  }

  if (screen === "search") {
    return {
      key: "search",
      gradient: atmosphereGradient("vault"),
      tone: "night",
      energy: 3,
    };
  }

  return {
    key: screen || "canvas",
    gradient: timeOfDayGradient(),
    tone: hourTone(),
    energy: 4,
  };
}

function hourTone(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h <= 8) return "dawn";
  if (h >= 9 && h <= 16) return "day";
  if (h >= 17 && h <= 20) return "dusk";
  return "night";
}

/** Stable place key for crossfade + acoustic transitions. */
export function placeKey({ screen, roomId, immersive, trackId } = {}) {
  if (immersive && trackId) return `booth:${trackId}`;
  if (screen === "rooms" && roomId) return `rooms:${roomId}`;
  return String(screen || "home");
}
