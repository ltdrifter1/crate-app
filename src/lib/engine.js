// Recommendation + session engine. Pure functions (no React / Firebase / DOM).
import { camelotCompatible, getEnergyRangeForHour } from "./harmony";

export function computeHumanState(recentPlays, sessionStartTime) {
  if (!recentPlays.length) return { intensity: 0.5, openness: 0.5, momentum: 0, depth: 0, direction: 0, label: "arrival" };

  const now = Date.now();
  const recent = recentPlays.slice(0, 10);
  const sessionMins = sessionStartTime ? (now - sessionStartTime) / 60000 : 0;

  // Intensity: average energy of last 5 tracks, normalized to 0-1
  const avgEnergy = recent.slice(0, 5).reduce((s, r) => s + (r.energy || 5), 0) / Math.min(5, recent.length);
  const intensity = Math.max(0, Math.min(1, (avgEnergy - 1) / 9));

  // Direction: energy trend. Compare last 3 avg vs previous 3 avg.
  const last3 = recent.slice(0, 3).reduce((s, r) => s + (r.energy || 5), 0) / Math.min(3, recent.length);
  const prev3 = recent.slice(3, 6);
  const prevAvg = prev3.length > 0 ? prev3.reduce((s, r) => s + (r.energy || 5), 0) / prev3.length : last3;
  const direction = Math.max(-1, Math.min(1, (last3 - prevAvg) / 3));

  // Openness: genre variety in recent plays. More genres = higher openness.
  const genres = new Set(recent.map(r => r.genre).filter(Boolean));
  const openness = Math.max(0, Math.min(1, genres.size / Math.max(4, recent.length) * 1.5));

  // Depth: session duration + completion rate proxy
  const depth = Math.max(0, Math.min(1, sessionMins / 60));

  // Momentum: how quickly tracks are being played (shorter gaps = higher momentum)
  const gaps = [];
  for (let i = 0; i < recent.length - 1; i++) {
    gaps.push(recent[i].ts - recent[i + 1].ts);
  }
  const avgGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 300000;
  const momentum = Math.max(0, Math.min(1, 1 - (avgGap - 60000) / 600000));

  // State label based on signals
  let label = "arrival";
  if (sessionMins < 3) label = "arrival";
  else if (sessionMins < 8 && Math.abs(direction) < 0.2) label = "grounding";
  else if (direction > 0.3 && intensity < 0.7) label = "ignition";
  else if (intensity > 0.6 && direction > 0.1) label = "momentum";
  else if (depth > 0.5 && Math.abs(direction) < 0.15) label = "immersion";
  else if (direction > 0.3 && openness > 0.5) label = "expansion";
  else if (direction < -0.2) label = "release";
  else if (intensity < 0.3 && depth > 0.4) label = "restoration";
  else if (sessionMins > 5) label = "grounding";

  return { intensity, openness, momentum, depth, direction, label };
}


// ─── HYPNO VISION — psychoacoustic trait-vector similarity · Hypno Vision ───────────────────────
export function findResonant(sourceTrack, allTracks, count = 12) {
  if (!sourceTrack._signal) return allTracks.slice(0, count);
  const src = sourceTrack._signal;
  return allTracks
    .filter(t => t.id !== sourceTrack.id && t._signal)
    .map(t => {
      const s = t._signal;
      // Euclidean distance across all trait dimensions
      const dist = Math.sqrt(
        Math.pow((src.grip - s.grip) / 10, 2) +
        Math.pow((src.hold - s.hold) / 10, 2) +
        Math.pow((src.pull - s.pull) / 10, 2) +
        Math.pow((src.gravity - s.gravity) / 10, 2) +
        Math.pow((src.lift - s.lift) / 10, 2) +
        Math.pow((src.descent - s.descent) / 10, 2)
      );
      // Bonus for same genre and close energy
      let bonus = 0;
      if (t.genre === sourceTrack.genre) bonus += 0.05;
      if (Math.abs((t.energy||5) - (sourceTrack.energy||5)) <= 1) bonus += 0.03;
      if (sourceTrack.camelot && t.camelot && camelotCompatible(sourceTrack.camelot, t.camelot, 1)) bonus += 0.02;
      return { track: t, distance: dist - bonus };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(r => r.track);
}

// ─── AURA: TRAIT SCORING ENGINE ─────────────────────────────────────────────
// Computes behavioral trait scores for each track from play/skip/like data.
// Called once after tracks load, enriches each track object with Aura scores.

export function computeSignalTraits(tracks, recentPlays = []) {
  const maxPlays = Math.max(...tracks.map(t => t.playCount || 0), 1);
  const maxSkips = Math.max(...tracks.map(t => t.skipCount || 0), 1);
  const maxLikes = Math.max(...tracks.map(t => t.likeCount || 0), 1);

  // Build a play-sequence map for lift/descent scoring
  const sequences = [];
  for (let i = 0; i < recentPlays.length - 1; i++) {
    sequences.push({ from: recentPlays[i], to: recentPlays[i + 1] });
  }

  return tracks.map(t => {
    const plays = t.playCount || 0;
    const skips = t.skipCount || 0;
    const likes = t.likeCount || 0;
    const energy = t.energy || 5;

    // Grip: inverse of skip ratio. High completion = high grip.
    const skipRatio = plays > 0 ? skips / plays : 0.5;
    const grip = Math.round(Math.max(1, Math.min(10, (1 - skipRatio) * 10)));

    // Hold: based on play count relative to library average. Frequently played = high hold.
    const hold = Math.round(Math.max(1, Math.min(10, (plays / maxPlays) * 8 + (likes > 0 ? 2 : 0))));

    // Pull: how often this track is returned to. Liked + played multiple times = high pull.
    const pull = Math.round(Math.max(1, Math.min(10,
      (plays > 2 ? 3 : 0) + (likes > 0 ? 3 : 0) + (plays / maxPlays) * 4
    )));

    // Gravity: session-opener tendency. Approximated by high grip + moderate energy.
    const gravity = Math.round(Math.max(1, Math.min(10,
      grip * 0.5 + (energy >= 3 && energy <= 7 ? 3 : 1) + (pull > 5 ? 2 : 0)
    )));

    // Lift: does this track lead to higher energy next? Check sequences.
    const liftSeqs = sequences.filter(s => s.from.id === t.id);
    const avgLift = liftSeqs.length > 0
      ? liftSeqs.reduce((s, seq) => {
          const nextTrack = tracks.find(x => x.id === seq.to.id);
          return s + ((nextTrack?.energy || 5) - energy);
        }, 0) / liftSeqs.length
      : 0;
    const lift = Math.round(Math.max(1, Math.min(10, 5 + avgLift * 2)));

    // Descent: inverse of lift.
    const descent = Math.round(Math.max(1, Math.min(10, 5 - avgLift * 2)));

    // Dominant trait label
    const traits = { grip, hold, pull, gravity, lift, descent };
    const sorted = Object.entries(traits).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];

    // Map dominant trait to a user-facing label
    const LABELS = {
      grip: "opener", hold: "anchor", pull: "favorite",
      gravity: "opener", lift: "build", descent: "closer"
    };
    const signalLabel = LABELS[dominant] || "track";

    return { ...t, _signal: { grip, hold, pull, gravity, lift, descent, label: signalLabel } };
  });
}

// ─── WEIGHTED RADIO PICK ──────────────────────────────────────────────────────
// All tracks eligible; liked tracks get 3× weight
// Priority: camelot+energy → camelot → energy → anything
export function pickNextTrack(allTracks, currentTrack, memory = null) {
  if (!allTracks.length) return null;
  const hour = new Date().getHours();
  const [eMin, eMax] = getEnergyRangeForHour(hour);
  // Recency decay — exclude tracks played in last 2 hours
  const recentIds = memory ? new Set(
    memory.filter(r => r.ts > Date.now() - 2 * 60 * 60 * 1000).map(r => r.id)
  ) : new Set();
  // Genre momentum — boost the current genre streak
  const recentGenres = memory ? memory.slice(0, 3).map(r => r.genre).filter(Boolean) : [];
  const momentumGenre = recentGenres.length >= 2 && recentGenres[0] === recentGenres[1] ? recentGenres[0] : null;

  const pool = allTracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900 && !recentIds.has(t.id));
  if (!pool.length) {
    // Fallback: if recency filter emptied the pool, ignore it
    const fallback = allTracks.filter(t => t.id !== currentTrack?.id && (t.duration||0) <= 900);
    if (!fallback.length) return allTracks[0];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  function weightedPick(candidates) {
    const weighted = candidates.flatMap(t => {
      let w = t.liked ? 3 : 1;
      // Skip penalty
      const plays = t.playCount || 0;
      const skips = t.skipCount || 0;
      if (plays > 0 && skips > plays * 0.5) w = Math.max(1, Math.round(w * 0.3));
      else if (skips > 3) w = Math.max(1, Math.round(w * 0.6));
      // Genre momentum — 2× boost for tracks matching the streak
      if (momentumGenre && t.genre === momentumGenre) w *= 2;
      // Aura trait boost: high grip after a skip, high hold in deep sessions
      if (t._signal) {
        if (t._signal.grip >= 7) w += 1; // high-grip tracks slightly favored
        if (t._signal.pull >= 7) w += 1; // return favorites slightly favored
      }
      return Array(w).fill(t);
    });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  const p1 = pool.filter(t => camelotCompatible(currentTrack?.camelot,t.camelot) && t.energy>=eMin && t.energy<=eMax);
  if (p1.length) return weightedPick(p1);
  const p2 = pool.filter(t => camelotCompatible(currentTrack?.camelot,t.camelot));
  if (p2.length) return weightedPick(p2);
  const p3 = pool.filter(t => t.energy>=eMin && t.energy<=eMax);
  if (p3.length) return weightedPick(p3);
  return weightedPick(pool);
}


// ─── ROUTE BUILDER ───────────────────────────────────────────────────────────
// Given a start track and end track, build a harmonic path between them.
// Steps through adjacent Camelot keys, interpolating energy from start to end.
export function buildRoute(allTracks, startTrack, endTrack, maxSteps = 12) {
  if (!startTrack || !endTrack || startTrack.id === endTrack.id) return [startTrack, endTrack].filter(Boolean);
  const startE = startTrack.energy || 5;
  const endE = endTrack.energy || 5;
  const pool = allTracks.filter(t => t.id !== startTrack.id && t.id !== endTrack.id && (t.duration||0) <= 900);

  const route = [startTrack];
  let current = startTrack;
  const used = new Set([startTrack.id, endTrack.id]);

  for (let step = 1; step <= maxSteps; step++) {
    const progress = step / (maxSteps + 1);
    const targetEnergy = Math.round(startE + (endE - startE) * progress);

    // Find candidates: Camelot-adjacent to current, closest to target energy, not used
    const candidates = pool
      .filter(t => !used.has(t.id) && camelotCompatible(current.camelot, t.camelot, 1))
      .map(t => ({ track: t, score: Math.abs((t.energy||5) - targetEnergy) }))
      .sort((a, b) => a.score - b.score);

    if (!candidates.length) break;

    // Check if we can reach the end track from here
    if (camelotCompatible(candidates[0].track.camelot, endTrack.camelot, 2)) {
      // Close enough to bridge to end — pick best and stop
      route.push(candidates[0].track);
      used.add(candidates[0].track.id);
      break;
    }

    route.push(candidates[0].track);
    used.add(candidates[0].track.id);
    current = candidates[0].track;
  }

  route.push(endTrack);
  return route;
}

// ─── SESSION ENGINE ──────────────────────────────────────────────────────────
// Activity-based energy arc profiles. Each phase has a proportion (0-1) and target energy.
export const SESSION_PROFILES = {
  party:      { label:"Party",       phases:[{name:"Warm Up",p:0.15,e:4},{name:"Build",p:0.2,e:6},{name:"Peak",p:0.35,e:9},{name:"Sustain",p:0.2,e:8},{name:"Wind Down",p:0.1,e:5}] },
  run:        { label:"Run",         phases:[{name:"Pace Up",p:0.1,e:6},{name:"Stride",p:0.4,e:8},{name:"Push",p:0.35,e:9},{name:"Cool",p:0.15,e:5}] },
  workout:    { label:"Workout",     phases:[{name:"Warm Up",p:0.12,e:5},{name:"Build",p:0.2,e:7},{name:"Peak",p:0.4,e:9},{name:"Push",p:0.18,e:8},{name:"Stretch",p:0.1,e:3}] },
  chill:      { label:"Chill",       phases:[{name:"Drift",p:0.3,e:3},{name:"Float",p:0.4,e:2},{name:"Settle",p:0.3,e:3}] },
  focus:      { label:"Focus",       phases:[{name:"Settle In",p:0.15,e:4},{name:"Flow",p:0.6,e:3},{name:"Sustain",p:0.2,e:4},{name:"Ease Out",p:0.05,e:3}] },
  drive:      { label:"Late Drive",  phases:[{name:"Depart",p:0.15,e:5},{name:"Cruise",p:0.5,e:6},{name:"Deep",p:0.25,e:4},{name:"Arrive",p:0.1,e:3}] },
  dinner:     { label:"Dinner",      phases:[{name:"Arrival",p:0.2,e:4},{name:"Conversation",p:0.5,e:3},{name:"Linger",p:0.3,e:4}] },
  predrinks:  { label:"Pre-drinks",  phases:[{name:"Ease In",p:0.2,e:4},{name:"Lift",p:0.35,e:6},{name:"Buzz",p:0.3,e:7},{name:"Ready",p:0.15,e:8}] },
  study:      { label:"Study",       phases:[{name:"Settle",p:0.1,e:3},{name:"Deep Work",p:0.7,e:2},{name:"Break",p:0.1,e:4},{name:"Close",p:0.1,e:2}] },
  recovery:   { label:"Recovery",    phases:[{name:"Ground",p:0.2,e:2},{name:"Restore",p:0.5,e:1},{name:"Ease Up",p:0.3,e:3}] },
};

export function buildSession(allTracks, durationMins, activityId) {
  const profile = SESSION_PROFILES[activityId];
  if (!profile) return [];
  const pool = allTracks.filter(t => (t.duration||0) <= 900 && (t.duration||0) > 0);
  if (!pool.length) return [];

  const totalSecs = durationMins * 60;
  const avgTrackLen = pool.reduce((s,t)=>s+(t.duration||210),0) / pool.length;
  const targetCount = Math.max(3, Math.round(totalSecs / avgTrackLen));

  const session = [];
  const used = new Set();
  let accumulated = 0;

  for (const phase of profile.phases) {
    const phaseTarget = phase.e;
    const phaseTracks = Math.max(1, Math.round(targetCount * phase.p));

    // Find tracks near this energy level, prefer camelot compatibility with last track
    const lastTrack = session.length ? session[session.length-1] : null;
    let candidates = pool
      .filter(t => !used.has(t.id))
      .map(t => {
        let score = Math.abs((t.energy||5) - phaseTarget) * 3;
        if (lastTrack && !camelotCompatible(lastTrack.camelot, t.camelot, 2)) score += 2;
        if (t.liked) score -= 0.5;
        const skips = t.skipCount || 0;
        const plays = t.playCount || 0;
        if (plays > 0 && skips > plays * 0.5) score += 3;
        return { track:t, score };
      })
      .sort((a,b) => a.score - b.score);

    for (let i = 0; i < phaseTracks && candidates.length > 0; i++) {
      // Pick from top 3 randomly for variety
      const pick = candidates.splice(Math.floor(Math.random() * Math.min(3, candidates.length)), 1)[0];
      if (!pick) break;
      session.push({ ...pick.track, _phase: phase.name });
      used.add(pick.track.id);
      accumulated += (pick.track.duration || avgTrackLen);
      if (accumulated >= totalSecs * 1.05) break;
    }
    if (accumulated >= totalSecs * 1.05) break;
  }

  return session;
}

