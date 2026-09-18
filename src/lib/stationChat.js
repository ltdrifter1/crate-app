/**
 * Station chat — Home companion (ice rail / mobile sheet).
 * Pure helpers: sanitize, rate-limit, layout breakpoints, presence.
 * Firestore I/O lives in components/chat so Home boot can lazy-load it.
 */

import { dock } from "../theme";
import { brandStoragePrefix } from "../brand/identity";

export const CHAT_ROOM_ID = "home";
export const CHAT_MAX_TEXT = 200;
export const CHAT_MAX_NAME = 24;
export const CHAT_MIN_INTERVAL_MS = 2500;
export const CHAT_PRESENCE_TTL_MS = 90_000;
export const CHAT_HEARTBEAT_MS = 25_000;
export const CHAT_MESSAGE_LIMIT = 80;
/** Live thread only keeps this much history. */
export const CHAT_HISTORY_MS = 30 * 60 * 1000;
export const CHAT_DESKTOP_MIN = 768;
export const CHAT_WIDE_BOTH = 1440;
export const CHAT_NUB_WIDTH = 52;
export const CHAT_WINDOW_WIDTH = 328;
export const CHAT_QUEUE_WIDTH = 336;

const BUDDY_COLORS = ["#B8F24A", "#C5CAD3", "#8B939F", "#E8EAEE"];

export function toMillis(ts, fallback = 0) {
  if (ts == null) return fallback;
  if (typeof ts === "number" && Number.isFinite(ts)) return ts;
  if (typeof ts.toMillis === "function") {
    try {
      return ts.toMillis();
    } catch {
      return fallback;
    }
  }
  if (typeof ts.seconds === "number") {
    return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
  }
  if (ts instanceof Date) return ts.getTime();
  return fallback;
}

function stripControlChars(s) {
  let out = "";
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c >= 32 && c !== 127) out += s[i];
  }
  return out;
}

export function sanitizeChatText(raw) {
  let s = stripControlChars(String(raw ?? ""));
  s = s.replace(/<[^>]*>/g, " ");
  s = s.replace(/https?:\/\/\S+|www\.\S+/gi, (m) => m.slice(0, 120));
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > CHAT_MAX_TEXT) s = s.slice(0, CHAT_MAX_TEXT);
  return s;
}

export function sanitizeDisplayName(raw) {
  let s = stripControlChars(String(raw ?? ""))
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "Listener";
  return s.slice(0, CHAT_MAX_NAME);
}

export function canSendAt(lastSentAt, now = Date.now()) {
  if (!lastSentAt) return { ok: true, waitMs: 0 };
  const elapsed = now - lastSentAt;
  if (elapsed >= CHAT_MIN_INTERVAL_MS) return { ok: true, waitMs: 0 };
  return { ok: false, waitMs: CHAT_MIN_INTERVAL_MS - elapsed };
}

export function isPresenceOnline(lastSeen, now = Date.now()) {
  const ms = toMillis(lastSeen, 0);
  return ms > 0 && now - ms < CHAT_PRESENCE_TTL_MS;
}

export function buddyInitials(name) {
  const parts = sanitizeDisplayName(name).split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const one = parts[0] || "L";
  return one.slice(0, 2).toUpperCase();
}

export function buddyColor(uid) {
  const s = String(uid || "x");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return BUDDY_COLORS[h % BUDDY_COLORS.length];
}

export function mapChatDoc(id, data = {}, now = Date.now()) {
  return {
    id,
    uid: String(data.uid || ""),
    displayName: sanitizeDisplayName(data.displayName),
    text: sanitizeChatText(data.text),
    createdAt: toMillis(data.createdAt, now),
    trackId: data.trackId ? String(data.trackId).slice(0, 80) : null,
    trackTitle: data.trackTitle ? String(data.trackTitle).slice(0, 80) : null,
    clientId: data.clientId ? String(data.clientId).slice(0, 40) : null,
  };
}

export function isChatHistoryFresh(createdAt, now = Date.now(), windowMs = CHAT_HISTORY_MS) {
  const t = toMillis(createdAt, 0);
  if (!t) return true;
  return now - t <= windowMs;
}

export function recentChatMessages(messages = [], now = Date.now(), windowMs = CHAT_HISTORY_MS) {
  return messages.filter((m) => m && isChatHistoryFresh(m.createdAt, now, windowMs));
}

export function mergeChatMessages(remote = [], optimistic = []) {
  const seen = new Set();
  const out = [];
  for (const msg of remote) {
    if (!msg?.id && !msg?.clientId) continue;
    if (!msg.text) continue;
    const key = msg.clientId || msg.id;
    if (seen.has(key) || seen.has(msg.id)) continue;
    seen.add(key);
    seen.add(msg.id);
    out.push(msg);
  }
  for (const msg of optimistic) {
    const key = msg.clientId || msg.id;
    if (seen.has(key)) continue;
    const dup = out.some(
      (m) =>
        m.uid === msg.uid &&
        m.text === msg.text &&
        Math.abs((m.createdAt || 0) - (msg.createdAt || 0)) < 15_000
    );
    if (dup) continue;
    seen.add(key);
    out.push(msg);
  }
  return out.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function formatChatTime(ms, now = Date.now()) {
  const t = toMillis(ms, 0);
  if (!t) return "";
  const delta = now - t;
  if (delta < 45_000) return "now";
  const d = new Date(t);
  const sameDay =
    d.getFullYear() === new Date(now).getFullYear() &&
    d.getMonth() === new Date(now).getMonth() &&
    d.getDate() === new Date(now).getDate();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function chatLayoutForWidth(width) {
  return width >= CHAT_DESKTOP_MIN ? "desktop-rail" : "mobile-sheet";
}

/**
 * Desktop right chrome: chat owns the old queue column when open.
 * Queue stays hidden on Home; a slim nub is the only collapsed state.
 */
export function desktopMessengerPlacement(width, open) {
  void width;
  if (!open) {
    return { mode: "nub", flexWidth: CHAT_NUB_WIDTH, overlay: false, overlayWidth: 0 };
  }
  return {
    mode: "dock",
    flexWidth: CHAT_QUEUE_WIDTH,
    overlay: false,
    overlayWidth: 0,
  };
}

export function mobileChatPillBottomPx(hasDockPlayer) {
  const stack = hasDockPlayer ? dock.clearPlayer : dock.clearTabs;
  return stack + 10;
}

export function railStorageKey() {
  return `${brandStoragePrefix()}.stationChat.rail`;
}

export function readRailOpen() {
  try {
    const v = localStorage.getItem(railStorageKey());
    if (v === "collapsed") return false;
    return true;
  } catch {
    return true;
  }
}

export function writeRailOpen(open) {
  try {
    localStorage.setItem(railStorageKey(), open ? "open" : "collapsed");
  } catch {
    /* quota / private mode */
  }
}

export function newClientId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `c${Date.now().toString(36)}${rand}`.slice(0, 40);
}

export function buildChatPayload({
  uid,
  displayName,
  text,
  nowPlaying = null,
  clientId = null,
}) {
  if (!uid) return { error: "auth" };
  const clean = sanitizeChatText(text);
  if (!clean) return { error: "empty" };
  const payload = {
    uid: String(uid),
    displayName: sanitizeDisplayName(displayName),
    text: clean,
    clientId: String(clientId || newClientId()).slice(0, 40),
  };
  if (nowPlaying?.id) {
    payload.trackId = String(nowPlaying.id).slice(0, 80);
    if (nowPlaying.title) payload.trackTitle = String(nowPlaying.title).slice(0, 80);
  }
  return { payload };
}

export function onlineBuddies(presence = [], now = Date.now(), limit = 8) {
  return presence
    .filter((p) => p?.uid && isPresenceOnline(p.lastSeen, now))
    .sort((a, b) => sanitizeDisplayName(a.displayName).localeCompare(sanitizeDisplayName(b.displayName)))
    .slice(0, limit);
}
