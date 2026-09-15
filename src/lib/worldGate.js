import { brandStoragePrefix } from "../brand/identity";
import { worldEnteredStorageKey } from "./worldLook";

function store() {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

export function worldGateKey() {
  return worldEnteredStorageKey(brandStoragePrefix());
}

export function hasEnteredWorld() {
  const s = store();
  if (!s) return false;
  try {
    return s.getItem(worldGateKey()) === "1";
  } catch {
    return false;
  }
}

export function markEnteredWorld() {
  const s = store();
  if (!s) return;
  try {
    s.setItem(worldGateKey(), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function resetEnteredWorld() {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(worldGateKey());
  } catch {
    /* ignore */
  }
}
