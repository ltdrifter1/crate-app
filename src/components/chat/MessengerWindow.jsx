/**
 * Ice station messenger — frosted live room. Not MSN chrome.
 */
import { useEffect, useRef, useState } from "react";
import {
  color, font, fontDisplay, ice, motion,
} from "../../theme";
import {
  buddyColor,
  buddyInitials,
  formatChatTime,
  isPresenceOnline,
  onlineBuddies,
  CHAT_MAX_TEXT,
} from "../../lib/stationChat";

function IcePip({ size = 7 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: ice.pip,
        boxShadow: `0 0 10px ${ice.glow}`,
        flexShrink: 0,
      }}
    />
  );
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
          linear-gradient(160deg, rgba(255,255,255,0.45) 0%, transparent 46%),
          ${fill}
        `,
        color: color.onAccent,
        fontFamily: fontDisplay,
        fontSize: size < 24 ? 8 : 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${ice.rim}`,
        boxShadow: `0 0 0 1px rgba(8,16,22,0.55), 0 0 12px ${ice.glow}`,
        flexShrink: 0,
        letterSpacing: -0.2,
      }}
    >
      {buddyInitials(person.displayName)}
    </div>
  );
}

function GhostBtn({ label, onClick, glyph }) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${ice.rimSoft}`,
        background: ice.frost,
        color: ice.ink,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontSize: 16,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      {glyph}
    </button>
  );
}

function TitleBar({ title, subtitle, onMinimize, onClose, compact = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: compact ? "10px 12px" : "12px 14px",
        background: ice.frost,
        borderBottom: `1px solid ${ice.rimSoft}`,
        flexShrink: 0,
      }}
    >
      <IcePip />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: compact ? 13 : 14,
            fontWeight: 650,
            letterSpacing: -0.25,
            color: ice.ink,
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
              marginTop: 2,
              fontFamily: font,
              fontSize: 11.5,
              fontWeight: 500,
              color: ice.mute,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <GhostBtn label="Minimize chat" onClick={onMinimize} glyph="–" />
        <GhostBtn label="Close chat" onClick={onClose} glyph="×" />
      </div>
    </div>
  );
}

function BuddyStrip({ presence, now }) {
  const online = onlineBuddies(presence, now, 8);
  if (online.length === 0) {
    return (
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${ice.rimSoft}`,
          background: "rgba(8,18,26,0.35)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 0.2,
            color: ice.mute,
          }}
        >
          Listening
        </div>
        <div style={{ marginTop: 3, fontSize: 12.5, color: ice.ink, fontFamily: font }}>
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
        gap: 10,
        padding: "10px 14px",
        borderBottom: `1px solid ${ice.rimSoft}`,
        background: "rgba(8,18,26,0.35)",
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
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 0.15,
            color: ice.pip,
          }}
        >
          {online.length} listening
        </div>
        <div
          style={{
            fontSize: 12,
            color: ice.mute,
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
        marginBottom: 12,
        padding: mine ? "0 2px 0 28px" : "0 28px 0 2px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
          flexDirection: mine ? "row-reverse" : "row",
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 650,
            color: mine ? ice.pip : ice.ink,
            letterSpacing: -0.1,
          }}
        >
          {msg.displayName}
        </span>
        <span
          style={{
            fontFamily: font,
            fontSize: 11,
            color: ice.mute,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatChatTime(msg.createdAt, now)}
        </span>
      </div>
      <div
        style={{
          maxWidth: "100%",
          padding: "8px 12px",
          borderRadius: mine ? "16px 16px 5px 16px" : "16px 16px 16px 5px",
          background: mine ? ice.bubbleMine : ice.bubble,
          border: `1px solid ${ice.rimSoft}`,
          color: ice.ink,
          fontFamily: font,
          fontSize: 14.5,
          fontWeight: 450,
          lineHeight: 1.42,
          letterSpacing: -0.16,
          wordBreak: "break-word",
          boxShadow: mine ? `0 0 18px ${ice.glow}` : "none",
        }}
      >
        {msg.text}
      </div>
      {msg.trackTitle ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: ice.mute,
            fontFamily: font,
          }}
        >
          on {msg.trackTitle}
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
  typing = null,
  emptyHint = "Quiet on the station. Say something.",
  composerAutoFocus = false,
}) {
  const [draft, setDraft] = useState("");
  const scroller = useRef(null);
  const online = presence.filter((p) => isPresenceOnline(p.lastSeen, now));
  const subtitle = nowPlaying?.title
    ? `${nowPlaying.title}${nowPlaying.artist ? ` — ${nowPlaying.artist}` : ""}`
    : online.length
      ? `${online.length} listening`
      : "Live on the station";

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

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
        borderRadius: 18,
        overflow: "hidden",
        border: `1px solid ${ice.rim}`,
        background: ice.pane,
        boxShadow: `
          inset 0 1px 0 rgba(224,242,254,0.22),
          0 0 40px ${ice.glow},
          0 18px 48px rgba(0,0,0,0.38)
        `,
        backdropFilter: "blur(28px) saturate(1.35)",
        WebkitBackdropFilter: "blur(28px) saturate(1.35)",
      }}
    >
      <TitleBar
        title="Live chat"
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
          padding: "14px 14px 10px",
          background: ice.thread,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: "32px 12px",
              textAlign: "center",
              color: ice.mute,
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
        {typing ? (
          <div
            data-testid="chat-typing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 6px 8px",
              color: ice.mute,
              fontSize: 12.5,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ice.pip,
                boxShadow: `0 0 8px ${ice.glow}`,
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            {typing} is typing
          </div>
        ) : null}
      </div>
      {error ? (
        <div
          role="status"
          style={{
            padding: "6px 14px",
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
          padding: "12px 12px 14px",
          borderTop: `1px solid ${ice.rimSoft}`,
          background: "rgba(10, 22, 32, 0.55)",
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
            height: 40,
            padding: "0 14px",
            borderRadius: 8,
            border: `1px solid ${ice.rim}`,
            background: "rgba(6, 16, 24, 0.72)",
            color: ice.ink,
            fontFamily: font,
            fontSize: 15,
            outline: "none",
            boxShadow: `inset 0 1px 0 rgba(255,106,43,0.08), 0 0 0 3px transparent`,
          }}
        />
        <button
          type="submit"
          data-testid="chat-send"
          disabled={!canSend || !draft.trim()}
          style={{
            height: 40,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,106,43,0.4)",
            background: draft.trim()
              ? "linear-gradient(180deg, #FFB347 0%, #FF6A2B 100%)"
              : ice.frost,
            color: draft.trim() ? color.onAccent : ice.mute,
            fontFamily: font,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: -0.1,
            cursor: draft.trim() && canSend ? "pointer" : "default",
            boxShadow: draft.trim() ? `0 0 18px ${ice.glow}` : "none",
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
        border: `1px solid ${ice.rimSoft}`,
        borderRight: "none",
        borderRadius: "16px 0 0 16px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "14px 6px 16px",
        gap: 10,
        background: ice.pane,
        boxShadow: `inset 0 1px 0 rgba(224,242,254,0.18), -10px 0 28px ${ice.glow}`,
        color: ice.ink,
      }}
    >
      <IcePip />
      <div
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 650,
          letterSpacing: 0.4,
          color: ice.ink,
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
          fontSize: 11,
          fontWeight: 700,
          color: ice.pip,
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
  position = "fixed",
}) {
  const count = onlineBuddies(presence, now, 20).length;
  return (
    <button
      type="button"
      data-testid="messenger-pill"
      aria-label="Open station chat"
      onClick={onOpen}
      style={{
        position,
        right: 16,
        bottom: `calc(${bottomPx}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 44,
        padding: "0 14px 0 12px",
        borderRadius: 10,
        border: `1px solid ${ice.rim}`,
        background: ice.pane,
        backdropFilter: "blur(20px) saturate(1.3)",
        WebkitBackdropFilter: "blur(20px) saturate(1.3)",
        boxShadow: `inset 0 1px 0 rgba(224,242,254,0.22), 0 10px 28px ${ice.glow}`,
        color: ice.ink,
        cursor: "pointer",
        pointerEvents: "auto",
        fontFamily: font,
        animation: `rise 0.4s ${motion.ease} both`,
      }}
    >
      <IcePip />
      <span style={{ fontSize: 14, fontWeight: 650, letterSpacing: -0.15 }}>Chat</span>
      {count > 0 ? (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: ice.pip,
          }}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function MessengerSheet({ children, onClose, position = "fixed" }) {
  return (
    <div
      data-testid="messenger-sheet"
      style={{
        position,
        inset: 0,
        zIndex: 140,
        background: "rgba(4,10,16,0.52)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          height: "min(88dvh, 720px)",
          maxHeight: "100%",
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
            background: ice.rim,
            margin: "8px auto 6px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

export { BuddyNub };
