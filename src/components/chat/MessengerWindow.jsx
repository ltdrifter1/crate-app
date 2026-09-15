/**
 * MSN-inspired messenger chrome — presentational.
 * Premium Y2K window, lime/cyan accents, system iOS type. Not costume jewelry.
 */
import { useEffect, useRef, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, hardware, motion, radius, y2k,
} from "../../theme";
import {
  buddyColor,
  buddyInitials,
  formatChatTime,
  isPresenceOnline,
  onlineBuddies,
  CHAT_MAX_TEXT,
} from "../../lib/stationChat";
function gemStyle(size = 8) {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    background: y2k.neon,
    boxShadow: `0 0 0 1px rgba(8,10,13,0.35), 0 0 10px ${y2k.neonSoft}`,
    flexShrink: 0,
  };
}

function BuddyNub({ person, size = 26 }) {
  const fill = person.color || buddyColor(person.uid);
  return (
    <div
      title={person.displayName}
      aria-label={person.displayName}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `
          linear-gradient(160deg, rgba(255,255,255,0.35) 0%, transparent 42%),
          ${fill}
        `,
        color: color.onAccent,
        fontFamily: fontDisplay,
        fontSize: size < 24 ? 8 : 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1.5px solid ${y2k.nearBlack}`,
        boxShadow: `0 0 0 1.5px ${y2k.neon}`,
        flexShrink: 0,
        letterSpacing: -0.2,
      }}
    >
      {buddyInitials(person.displayName)}
    </div>
  );
}

function WindowButtons({ onMinimize, onClose }) {
  const btn = (label, onClick, glyph) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        border: "1px solid rgba(8,10,13,0.22)",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 40%, transparent 100%),
          linear-gradient(165deg, #E7EBF0 0%, #9AA3AE 100%)
        `,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.25)",
        color: y2k.charcoal,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {glyph}
    </button>
  );
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {onMinimize ? btn("Minimize chat", onMinimize, "–") : null}
      {onClose ? btn("Close chat", onClose, "×") : null}
    </div>
  );
}

function TitleBar({ title, subtitle, onMinimize, onClose, compact = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: compact ? "8px 10px" : "9px 12px",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 42%, transparent 100%),
          linear-gradient(90deg, #2A3038 0%, #1C2128 48%, #161A20 100%)
        `,
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true" style={gemStyle(8)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: compact ? 12.5 : 13.5,
            fontWeight: 700,
            letterSpacing: -0.2,
            color: y2k.offWhite,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 1,
              fontFamily: font,
              fontSize: 11,
              fontWeight: 500,
              color: color.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <WindowButtons onMinimize={onMinimize} onClose={onClose} />
    </div>
  );
}

function BuddyStrip({ presence, now }) {
  const online = onlineBuddies(presence, now, 8);
  if (online.length === 0) {
    return (
      <div
        style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${glass.borderFaint}`,
          background: "rgba(8,10,13,0.28)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: color.faint,
          }}
        >
          Buddy list
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: color.muted, fontFamily: font }}>
          You&apos;re on the station
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderBottom: `1px solid ${glass.borderFaint}`,
        background: "rgba(8,10,13,0.28)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {online.slice(0, 5).map((p, i) => (
          <div key={p.uid} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }}>
            <BuddyNub person={p} size={24} />
          </div>
        ))}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.3,
            textTransform: "uppercase",
            color: y2k.neon,
          }}
        >
          {online.length} online
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: color.muted,
            fontFamily: font,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {online.map((p) => p.displayName).join(", ")}
        </div>
      </div>
    </div>
  );
}

function MessageRow({ msg, mine, now }) {
  return (
    <div
      data-testid="chat-message"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start",
        marginBottom: 10,
        padding: mine ? "0 2px 0 28px" : "0 28px 0 2px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 3,
          flexDirection: mine ? "row-reverse" : "row",
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 650,
            color: mine ? y2k.cyan : y2k.neon,
            letterSpacing: -0.1,
          }}
        >
          {msg.displayName}
        </span>
        <span
          style={{
            fontFamily: font,
            fontSize: 11,
            color: color.faint,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatChatTime(msg.createdAt, now)}
        </span>
      </div>
      <div
        style={{
          maxWidth: "100%",
          padding: "7px 10px",
          borderRadius: mine ? "10px 10px 3px 10px" : "10px 10px 10px 3px",
          background: mine
            ? "linear-gradient(165deg, rgba(101,230,255,0.16) 0%, rgba(101,230,255,0.05) 100%)"
            : "rgba(255,255,255,0.05)",
          border: mine
            ? "1px solid rgba(101,230,255,0.22)"
            : "1px solid rgba(255,255,255,0.07)",
          color: y2k.offWhite,
          fontFamily: font,
          fontSize: 14,
          fontWeight: 450,
          lineHeight: 1.4,
          letterSpacing: -0.15,
          wordBreak: "break-word",
        }}
      >
        {msg.text}
      </div>
      {msg.trackTitle ? (
        <div
          style={{
            marginTop: 3,
            fontSize: 10.5,
            color: color.faint,
            fontFamily: font,
          }}
        >
          while {msg.trackTitle}
        </div>
      ) : null}
    </div>
  );
}

export function MessengerWindow({
  messages = [],
  presence = [],
  uid = null,
  nowPlaying = null,
  error = null,
  canSend = true,
  onSend,
  onMinimize,
  onClose,
  now = Date.now(),
  emptyHint = "No one's talking yet. Be the first on the station.",
  composerAutoFocus = false,
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef(null);
  const online = presence.filter((p) => isPresenceOnline(p.lastSeen, now));
  const subtitle = nowPlaying?.title
    ? `Now: ${nowPlaying.title}${nowPlaying.artist ? ` — ${nowPlaying.artist}` : ""}`
    : online.length
      ? `${online.length} listening`
      : "Who's listening";

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = (e) => {
    e?.preventDefault?.();
    const text = draft;
    if (!text.trim()) return;
    const result = onSend?.(text);
    if (result && typeof result.then === "function") {
      result.then((res) => {
        if (!res || res.ok !== false) setDraft("");
      });
    } else if (!result || result.ok !== false) {
      setDraft("");
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Station chat"
      data-testid="messenger-window"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(231,235,240,0.2)",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 28%),
          linear-gradient(165deg, #1A1F26 0%, #10141A 100%)
        `,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.16),
          inset 0 -1px 0 rgba(0,0,0,0.45),
          0 18px 48px rgba(0,0,0,0.45)
        `,
      }}
    >
      <TitleBar
        title="Planet MP3 Chat"
        subtitle={subtitle}
        onMinimize={onMinimize}
        onClose={onClose}
      />
      <BuddyStrip presence={presence} now={now} />
      <div
        ref={scroller}
        data-testid="chat-thread"
        className="hide-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "12px 12px 8px",
          background: `
            linear-gradient(180deg, rgba(101,230,255,0.04) 0%, transparent 28%),
            linear-gradient(160deg, #0A1016 0%, #06090E 100%)
          `,
          boxShadow: "inset 0 2px 10px rgba(0,0,0,0.35)",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: "28px 12px",
              textAlign: "center",
              color: color.muted,
              fontFamily: font,
              fontSize: 13.5,
              lineHeight: 1.45,
            }}
          >
            {emptyHint}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageRow
              key={msg.id || msg.clientId}
              msg={msg}
              mine={!!uid && msg.uid === uid}
              now={now}
            />
          ))
        )}
      </div>
      {error ? (
        <div
          role="status"
          style={{
            padding: "6px 12px",
            fontSize: 12,
            color: color.alert,
            fontFamily: font,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      ) : null}
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 10px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%),
            rgba(16,18,22,0.92)
          `,
          flexShrink: 0,
        }}
      >
        <input
          aria-label="Message the station"
          data-testid="chat-input"
          value={draft}
          maxLength={CHAT_MAX_TEXT}
          placeholder={canSend ? "Say something…" : "Sign in to talk"}
          disabled={!canSend}
          autoFocus={composerAutoFocus}
          onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MAX_TEXT))}
          style={{
            flex: 1,
            minWidth: 0,
            height: 38,
            padding: "0 12px",
            borderRadius: radius.sm,
            border: "1px solid rgba(101,230,255,0.18)",
            background: "rgba(6,10,14,0.85)",
            color: color.ink,
            fontFamily: font,
            fontSize: 15,
            outline: "none",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.45)",
          }}
        />
        <button
          type="submit"
          data-testid="chat-send"
          disabled={!canSend || !draft.trim()}
          style={{
            height: 38,
            padding: "0 14px",
            borderRadius: hardware.radius,
            border: "1px solid rgba(255,255,255,0.18)",
            background: draft.trim()
              ? hardware.keyFace
              : "rgba(255,255,255,0.04)",
            color: draft.trim() ? y2k.offWhite : color.faint,
            boxShadow: draft.trim() ? hardware.keyRaised : "none",
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            cursor: draft.trim() && canSend ? "pointer" : "default",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export function MessengerNub({
  presence = [],
  onOpen,
  now = Date.now(),
}) {
  const online = onlineBuddies(presence, now, 4);
  return (
    <button
      type="button"
      data-testid="messenger-nub"
      aria-label="Open station chat"
      onClick={onOpen}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 160,
        border: "1px solid rgba(231,235,240,0.16)",
        borderRight: "none",
        borderRadius: "12px 0 0 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 6px 16px",
        gap: 10,
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 36%, transparent 70%),
          linear-gradient(145deg, #242A32 0%, #15191F 100%)
        `,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), -8px 0 24px rgba(0,0,0,0.18)",
        color: y2k.offWhite,
      }}
    >
      <span aria-hidden="true" style={gemStyle(8)} />
      <div
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: y2k.offWhite,
        }}
      >
        Chat
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
        {online.slice(0, 3).map((p) => (
          <BuddyNub key={p.uid} person={p} size={22} />
        ))}
      </div>
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 0.6,
          color: y2k.neon,
        }}
      >
        {online.length || "–"}
      </div>
    </button>
  );
}

export function MessengerPill({
  presence = [],
  onOpen,
  bottomPx = 98,
  now = Date.now(),
}) {
  const count = onlineBuddies(presence, now, 20).length;
  return (
    <button
      type="button"
      data-testid="messenger-pill"
      aria-label="Open station chat"
      onClick={onOpen}
      style={{
        position: "fixed",
        right: 16,
        bottom: `calc(${bottomPx}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 44,
        padding: "0 14px 0 12px",
        borderRadius: 980,
        border: "1px solid rgba(231,235,240,0.22)",
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%),
          rgba(18,20,24,0.78)
        `,
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 28px rgba(0,0,0,0.4)",
        color: y2k.offWhite,
        cursor: "pointer",
        fontFamily: font,
        animation: `rise 0.4s ${motion.ease} both`,
      }}
    >
      <span aria-hidden="true" style={gemStyle(8)} />
      <span style={{ fontSize: 14, fontWeight: 650, letterSpacing: -0.15 }}>Chat</span>
      {count > 0 ? (
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            color: y2k.neon,
            letterSpacing: 0.4,
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function MessengerSheet({ children, onClose }) {
  return (
    <div
      data-testid="messenger-sheet"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        background: "rgba(8,10,13,0.46)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          height: "min(88dvh, 720px)",
          padding: "0 0 env(safe-area-inset-bottom, 0px)",
          animation: `rise 0.32s ${motion.ease} both`,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            borderRadius: 4,
            background: "rgba(255,255,255,0.28)",
            margin: "8px auto 6px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

export { BuddyNub };
