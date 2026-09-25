import { brandStoragePrefix } from "../brand/identity";

const KEY = `${brandStoragePrefix()}:deckHintSeen:v2`;

export function hasSeenDeckHint() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

export function markDeckHintSeen() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
