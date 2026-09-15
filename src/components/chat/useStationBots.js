/**
 * Local station bots — keep the ice room feeling occupied.
 */
import { useEffect, useRef, useState } from "react";
import {
  STATION_BOTS,
  botPresence,
  buildBotMessage,
  nextBotLine,
  seedBotThread,
} from "../../lib/stationBots";

function nextDelay(rng = Math.random) {
  return 8000 + Math.floor(rng() * 14000);
}

export function useStationBots({
  nowPlaying = null,
  enabled = true,
} = {}) {
  const [messages, setMessages] = useState(() => seedBotThread(nowPlaying));
  const [typing, setTyping] = useState(null);
  const lastTextRef = useRef(messages[messages.length - 1]?.text || "");
  const turnRef = useRef(0);
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;

  useEffect(() => {
    if (!enabled) {
      setTyping(null);
      return undefined;
    }
    let cancelled = false;
    let waitId = 0;
    let typeId = 0;

    const loop = () => {
      waitId = window.setTimeout(() => {
        if (cancelled) return;
        const bot = STATION_BOTS[turnRef.current % STATION_BOTS.length];
        turnRef.current += 1;
        setTyping(bot.displayName);
        typeId = window.setTimeout(() => {
          if (cancelled) return;
          const text = nextBotLine(bot, lastTextRef.current, nowPlayingRef.current);
          lastTextRef.current = text;
          setTyping(null);
          setMessages((prev) => {
            const next = [...prev, buildBotMessage(bot, text, Date.now(), nowPlayingRef.current)];
            return next.slice(-16);
          });
          loop();
        }, 900 + Math.floor(Math.random() * 1100));
      }, nextDelay());
    };

    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(waitId);
      window.clearTimeout(typeId);
    };
  }, [enabled]);

  return {
    messages,
    presence: botPresence(),
    typing,
  };
}
