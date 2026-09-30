/**
 * Free-tier daily play accounting — limited digital streaming.
 */
import { BILLING } from "./entitlements";

/** Soft nudge when this many plays (or fewer) remain. */
export const FREE_PLAYS_NUDGE_AT = 5;

export function playsDayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function normalizePlayMeter(profile, now = new Date()) {
  const day = playsDayKey(now);
  const storedDay = profile?.playsDayKey || null;
  const count = storedDay === day ? Math.max(0, Number(profile?.playsToday) || 0) : 0;
  return { playsDayKey: day, playsToday: count };
}

export function freePlaysRemaining(profile, access, now = new Date()) {
  if (!access || access.streaming === "full") return Infinity;
  const cap = Number(access.freePlaysPerDay) || BILLING.freePlaysPerDay;
  const meter = normalizePlayMeter(profile, now);
  return Math.max(0, cap - meter.playsToday);
}

export function isFreePlayLimited(access) {
  return !!access && access.streaming === "limited";
}

/** True when Free meter should show (limited streaming). */
export function shouldShowFreePlaysMeter(access) {
  return isFreePlayLimited(access);
}

/** Soft nudge at low remaining plays (not when already blocked). */
export function shouldNudgeFreePlays(remaining, access) {
  if (!isFreePlayLimited(access)) return false;
  const left = Number(remaining);
  if (!Number.isFinite(left)) return false;
  return left > 0 && left <= FREE_PLAYS_NUDGE_AT;
}

/**
 * Short label for docks / Club chrome.
 * @returns {string|null}
 */
export function freePlaysMeterLabel(remaining, access) {
  if (!isFreePlayLimited(access)) return null;
  const left = Number(remaining);
  if (!Number.isFinite(left)) return null;
  const cap = Number(access?.freePlaysPerDay) || BILLING.freePlaysPerDay;
  if (left <= 0) return "0 plays left today";
  if (left === 1) return "1 play left today";
  if (left <= FREE_PLAYS_NUDGE_AT) return `${left} plays left today`;
  return `${left} of ${cap} plays left`;
}

export function canPlayOnFreeTier(profile, access, now = new Date()) {
  if (!access) return true;
  if (access.streaming === "full") return true;
  return freePlaysRemaining(profile, access, now) > 0;
}

/** Next profile fields after counting one play (Free tier only). */
export function bumpPlayMeter(profile, access, now = new Date()) {
  if (access?.streaming === "full") {
    return null; // no metering when unlimited
  }
  const meter = normalizePlayMeter(profile, now);
  return {
    playsDayKey: meter.playsDayKey,
    playsToday: meter.playsToday + 1,
  };
}
