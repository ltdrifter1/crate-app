/**
 * Client helpers — server-trusted listening + Club Credit spend via Cloud Functions.
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";
import { FUNCTIONS_REGION } from "./functionsRegion";

let functionsInstance = null;

function functions() {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app, FUNCTIONS_REGION);
  }
  return functionsInstance;
}

/**
 * Record a play on the server (meter + playCount + recentTracks).
 * @returns {Promise<object>}
 */
export async function recordListeningEvent(trackId) {
  const callable = httpsCallable(functions(), "recordListeningEvent");
  const { data } = await callable({ trackId: String(trackId || "") });
  return data || {};
}

/**
 * Spend Club Credit on a physical / Club Copy release.
 * @returns {Promise<object>}
 */
export async function spendClubCredit(trackId, amount = null) {
  const callable = httpsCallable(functions(), "spendClubCredit");
  const payload = { trackId: String(trackId || "") };
  if (amount != null && Number.isFinite(Number(amount))) {
    payload.amount = Number(amount);
  }
  const { data } = await callable(payload);
  return data || {};
}
