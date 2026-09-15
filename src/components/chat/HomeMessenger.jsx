/**
 * Home station chat host — lazy-loaded from App.
 * Desktop: ice rail occupies the right column (queue is hidden on Home).
 * Mobile: floating pill → bottom sheet.
 */
import { useEffect, useMemo, useState } from "react";
import {
  chatLayoutForWidth,
  desktopMessengerPlacement,
  mergeChatMessages,
  mobileChatPillBottomPx,
  readRailOpen,
  writeRailOpen,
  CHAT_NUB_WIDTH,
} from "../../lib/stationChat";
import { mergePresence } from "../../lib/stationBots";
import { useStationChat } from "./useStationChat";
import { useStationBots } from "./useStationBots";
import {
  MessengerNub,
  MessengerPill,
  MessengerSheet,
  MessengerWindow,
} from "./MessengerWindow";

export default function HomeMessenger({
  variant = "desktop",
  uid = null,
  displayName = "Listener",
  nowPlaying = null,
  hasDockPlayer = false,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280,
  defaultOpen = null,
  messages: messagesProp = null,
  presence: presenceProp = null,
  onSend: onSendProp = null,
  live = true,
  embedded = false,
  roomBots = true,
}) {
  const isMobile = variant === "mobile" || chatLayoutForWidth(viewportWidth) === "mobile-sheet";
  const [open, setOpen] = useState(() => {
    if (typeof defaultOpen === "boolean") return defaultOpen;
    if (isMobile) return false;
    return readRailOpen();
  });
  const [vp, setVp] = useState(viewportWidth);

  useEffect(() => {
    if (typeof defaultOpen === "boolean") return undefined;
    const onResize = () => setVp(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [defaultOpen]);

  const width = defaultOpen == null ? vp : viewportWidth;
  const placement = desktopMessengerPlacement(width, open && !isMobile);

  const listenMessages = live && open;
  const listenPresence = live && (open || !isMobile);

  const chat = useStationChat({
    uid,
    displayName,
    nowPlaying,
    listenMessages,
    listenPresence,
    enabled: live,
  });

  const bots = useStationBots({
    nowPlaying,
    enabled: roomBots && (open || !isMobile),
  });

  const messages = mergeChatMessages(messagesProp || chat.messages, roomBots ? bots.messages : []);
  const presence = mergePresence(presenceProp || chat.presence, roomBots ? bots.presence : []);
  const send = onSendProp || chat.send;

  const toggle = (next) => {
    const value = typeof next === "boolean" ? next : !open;
    setOpen(value);
    if (!isMobile) writeRailOpen(value);
  };

  const windowEl = (
    <MessengerWindow
      messages={messages}
      presence={presence}
      uid={uid}
      nowPlaying={nowPlaying}
      error={live ? chat.error : null}
      canSend={!!uid}
      onSend={send}
      onMinimize={() => toggle(false)}
      onClose={() => toggle(false)}
      composerAutoFocus={open}
      typing={roomBots ? bots.typing : null}
    />
  );

  const layout = useMemo(
    () => (isMobile ? "mobile-sheet" : "desktop-rail"),
    [isMobile]
  );

  if (isMobile) {
    return (
      <div
        data-testid="home-messenger"
        data-layout={layout}
        data-open={open ? "true" : "false"}
        style={embedded ? { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 40 } : undefined}
      >
        {!open ? (
          <MessengerPill
            presence={presence}
            onOpen={() => toggle(true)}
            bottomPx={mobileChatPillBottomPx(hasDockPlayer)}
            position={embedded ? "absolute" : "fixed"}
          />
        ) : (
          <MessengerSheet onClose={() => toggle(false)} position={embedded ? "absolute" : "fixed"}>
            {windowEl}
          </MessengerSheet>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="home-messenger"
      data-layout={layout}
      data-mode={placement.mode}
      data-open={open ? "true" : "false"}
      style={{
        overflow: "visible",
        width: open ? placement.flexWidth : CHAT_NUB_WIDTH,
        flexShrink: 0,
        position: "relative",
        alignSelf: "stretch",
        zIndex: 30,
        transition: "width 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {open ? (
        <div
          style={{
            height: "100%",
            padding: "8px 8px 8px 0",
          }}
        >
          {windowEl}
        </div>
      ) : (
        <MessengerNub presence={presence} onOpen={() => toggle(true)} />
      )}
    </div>
  );
}
