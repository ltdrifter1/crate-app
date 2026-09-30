/**
 * Firestore live station chat — lazy-loaded with the Home messenger chunk.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { getFirebase } from "../../firebase";
import {
  buildChatPayload,
  canSendAt,
  CHAT_HEARTBEAT_MS,
  CHAT_HISTORY_MS,
  CHAT_MESSAGE_LIMIT,
  CHAT_ROOM_ID,
  mapChatDoc,
  mergeChatMessages,
  recentChatMessages,
  isChatHistoryFresh,
  newClientId,
  sanitizeDisplayName,
} from "../../lib/stationChat";

function messagesCol(db, roomId) {
  return collection(db, "stationChat", roomId, "messages");
}

function presenceRef(db, roomId, uid) {
  return doc(db, "stationChat", roomId, "presence", uid);
}

export function useStationChat({
  uid = null,
  displayName = "Listener",
  nowPlaying = null,
  listenMessages = false,
  listenPresence = false,
  enabled = true,
  roomId = CHAT_ROOM_ID,
} = {}) {
  const [messages, setMessages] = useState([]);
  const [optimistic, setOptimistic] = useState([]);
  const [presence, setPresence] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const lastSentRef = useRef(0);
  const nowPlayingRef = useRef(nowPlaying);
  nowPlayingRef.current = nowPlaying;
  const [db, setDb] = useState(null);

  useEffect(() => {
    let alive = true;
    getFirebase().then((f) => {
      if (alive) setDb(f.db);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!enabled || !listenMessages || !db) {
      if (!listenMessages) {
        setMessages([]);
        setStatus("idle");
      }
      return undefined;
    }
    setStatus("loading");
    const cutoff = Timestamp.fromMillis(Date.now() - CHAT_HISTORY_MS);
    const q = query(
      messagesCol(db, roomId),
      where("createdAt", ">=", cutoff),
      orderBy("createdAt", "desc"),
      limit(CHAT_MESSAGE_LIMIT)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => mapChatDoc(d.id, d.data()))
          .filter((m) => m.text && isChatHistoryFresh(m.createdAt))
          .reverse();
        setMessages(rows);
        setStatus("live");
        setError(null);
        setOptimistic((prev) =>
          prev.filter((m) => !rows.some((r) => r.clientId && r.clientId === m.clientId))
        );
      },
      (err) => {
        console.warn("station chat listen failed", err);
        setError("Couldn't reach the station.");
        setStatus("error");
      }
    );
    return unsub;
  }, [enabled, listenMessages, roomId, db]);

  useEffect(() => {
    if (!enabled || !listenPresence || !db) {
      if (!listenPresence) setPresence([]);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, "stationChat", roomId, "presence"),
      (snap) => {
        setPresence(
          snap.docs.map((d) => {
            const data = d.data() || {};
            return {
              uid: d.id,
              displayName: sanitizeDisplayName(data.displayName),
              lastSeen: data.lastSeen,
              color: data.color || null,
            };
          })
        );
      },
      () => {
        /* presence is decorative */
      }
    );
    return unsub;
  }, [enabled, listenPresence, roomId, db]);

  const beat = useCallback(async () => {
    if (!uid || !db) return;
    try {
      await setDoc(
        presenceRef(db, roomId, uid),
        {
          uid,
          displayName: sanitizeDisplayName(displayName),
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("station presence failed", e);
    }
  }, [uid, displayName, roomId, db]);

  useEffect(() => {
    if (!enabled || !uid || !listenPresence) return undefined;
    beat();
    const id = setInterval(beat, CHAT_HEARTBEAT_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, uid, listenPresence, beat]);

  const send = useCallback(
    async (rawText) => {
      const gate = canSendAt(lastSentRef.current);
      if (!gate.ok) {
        setError("Easy — give it a second.");
        return { ok: false, error: "rate" };
      }
      const clientId = newClientId();
      const built = buildChatPayload({
        uid,
        displayName,
        text: rawText,
        nowPlaying: nowPlayingRef.current,
        clientId,
      });
      if (built.error) {
        setError(built.error === "auth" ? "Sign in to talk." : "Type a message first.");
        return { ok: false, error: built.error };
      }
      if (!db) {
        setError("Couldn't reach the station.");
        return { ok: false, error: "network" };
      }
      const now = Date.now();
      lastSentRef.current = now;
      setOptimistic((prev) => [
        ...prev,
        {
          id: clientId,
          ...built.payload,
          createdAt: now,
          pending: true,
        },
      ]);
      setError(null);
      try {
        await addDoc(messagesCol(db, roomId), {
          ...built.payload,
          createdAt: serverTimestamp(),
        });
        if (uid) {
          setDoc(
            presenceRef(db, roomId, uid),
            {
              uid,
              displayName: sanitizeDisplayName(displayName),
              lastChatAt: now,
              lastSeen: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
        return { ok: true, clientId };
      } catch (e) {
        console.warn("station chat send failed", e);
        lastSentRef.current = 0;
        setOptimistic((prev) => prev.filter((m) => m.clientId !== clientId));
        setError("Message didn't send. Try again.");
        return { ok: false, error: "network" };
      }
    },
    [uid, displayName, roomId, db]
  );

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const thread = useMemo(
    () => recentChatMessages(mergeChatMessages(messages, optimistic), nowTick),
    [messages, optimistic, nowTick]
  );

  return {
    messages: thread,
    presence,
    status,
    error,
    send,
    canSend: !!uid,
  };
}
