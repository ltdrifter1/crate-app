/**
 * Derive lightweight listening insights from catalog + profile fields we already have.
 * No invented backend — uses liked, recentTracks, playCount, likeCount, energy, genre.
 */
import { normalizeGenre } from "./genres";
import { collectionStats } from "./collectionStats";

function singles(tracks = []) {
  return (tracks || []).filter((t) => t && (t.duration || 0) <= 900);
}

function energyBand(avg) {
  if (avg == null || Number.isNaN(avg)) {
    return {
      id: "unknown",
      label: "Not enough yet",
      hint: "Play or like a few tracks and this fills in.",
    };
  }
  if (avg < 3.5) {
    return {
      id: "soft",
      label: "Calm",
      hint: "You usually go for quieter tracks.",
    };
  }
  if (avg < 5.5) {
    return {
      id: "steady",
      label: "Mid",
      hint: "Most of what you like sits in the middle.",
    };
  }
  if (avg < 7.5) {
    return {
      id: "lift",
      label: "Upbeat",
      hint: "You lean into brighter, pushier tracks.",
    };
  }
  return {
    id: "peak",
    label: "High energy",
    hint: "Your recent listens run hot.",
  };
}

function avgOf(list, key = "energy") {
  const vals = list.map((t) => Number(t?.[key])).filter((n) => Number.isFinite(n) && n > 0);
  if (!vals.length) return null;
  return vals.reduce((s, n) => s + n, 0) / vals.length;
}

/**
 * @param {Array} tracks — catalog with liked flags + counters
 * @param {{ genres?: string[], recentTracks?: Array<{trackId:string, playedAt?:string}>, signalLabel?: string|null }} opts
 */
export function buildListenInsights(tracks = [], opts = {}) {
  const preferred = (opts.genres || []).filter(Boolean);
  const recentRaw = Array.isArray(opts.recentTracks) ? opts.recentTracks : [];
  const byId = new Map((tracks || []).filter(Boolean).map((t) => [t.id, t]));

  const liked = singles(tracks).filter((t) => t.liked);
  const recent = recentRaw
    .map((r) => byId.get(r.trackId || r.id))
    .filter(Boolean);

  // Personal engagement pool — cuts you've saved or spun recently
  const engagedMap = new Map();
  liked.forEach((t) => engagedMap.set(t.id, t));
  recent.forEach((t) => engagedMap.set(t.id, t));
  const engaged = [...engagedMap.values()];

  const topPlayed = [...engaged]
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0) || String(a.title || "").localeCompare(String(b.title || "")))
    .filter((t) => (t.playCount || 0) > 0)
    .slice(0, 5);

  const topSaved = [...liked]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0) || (b.playCount || 0) - (a.playCount || 0))
    .slice(0, 5);

  // Taste mix from liked (fallback to recent)
  const tasteSource = liked.length ? liked : recent;
  const genreTallies = new Map();
  tasteSource.forEach((t) => {
    const g = normalizeGenre(t.genre) || "Other";
    genreTallies.set(g, (genreTallies.get(g) || 0) + 1);
  });
  const genreMix = [...genreTallies.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre));
  const genreTotal = genreMix.reduce((s, g) => s + g.count, 0) || 1;

  const recentEnergy = recent
    .slice(0, 16)
    .map((t) => Math.max(1, Math.min(10, Number(t.energy) || 5)))
    .reverse();

  const avgLikedEnergy = avgOf(liked);
  const avgRecentEnergy = avgOf(recent);
  const avgEnergy = avgRecentEnergy ?? avgLikedEnergy;
  const band = energyBand(avgEnergy);

  const fromListening = genreMix[0]?.genre || null;
  const leanLine = fromListening
    ? (preferred.includes(fromListening)
      ? `You lean into ${fromListening}`
      : `Lately you’re into ${fromListening}`)
    : (preferred.length
      ? `Your genres: ${preferred.slice(0, 3).join(" · ")}`
      : "Add a few genres to steer what we play");

  const collection = collectionStats(liked);
  const recentCount = recent.length;
  const likedCount = liked.length;

  return {
    preferred,
    leanLine,
    signalLabel: opts.signalLabel || null,
    band,
    avgEnergy: avgEnergy == null ? null : Math.round(avgEnergy * 10) / 10,
    recentEnergy,
    genreMix: genreMix.slice(0, 6).map((g) => ({
      ...g,
      pct: Math.round((g.count / genreTotal) * 100),
    })),
    topPlayed,
    topSaved,
    recent: recent.slice(0, 8),
    collection,
    likedCount,
    recentCount,
    coldStart: likedCount === 0 && recentCount === 0,
  };
}

export function energyBandLabel(avg) {
  return energyBand(avg).label;
}
