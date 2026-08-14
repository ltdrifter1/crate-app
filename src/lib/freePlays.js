/**
 * Free-tier daily play accounting — limited digital streaming.
 */
import { BILLING } from "./entitlements";

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
