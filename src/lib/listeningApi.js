/**
 * Client helpers — server-trusted listening + Club Credit spend via Cloud Functions.
 */
import { getFirebase } from "../firebase";
import { FUNCTIONS_REGION } from "./functionsRegion";

let functionsInstance = null;

async function functions() {
  if (!functionsInstance) {
    const { app } = await getFirebase();
    const { getFunctions } = await import("firebase/functions");
    functionsInstance = getFunctions(app, FUNCTIONS_REGION);
  }
  return functionsInstance;
}

async function callable(name) {
  const { httpsCallable } = await import("firebase/functions");
  return httpsCallable(await functions(), name);
}

export async function recordListeningEvent(trackId) {
  const call = await callable("recordListeningEvent");
  const { data } = await call({ trackId: String(trackId || "") });
  return data || {};
}

export async function spendClubCredit(trackId, amount = null) {
  const call = await callable("spendClubCredit");
  const payload = { trackId: String(trackId || "") };
  if (amount != null && Number.isFinite(Number(amount))) {
    payload.amount = Number(amount);
  }
  const { data } = await call(payload);
  return data || {};
}
