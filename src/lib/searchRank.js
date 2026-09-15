import { searchEntities } from "./catalog";
import { displaySceneLabel, matchSceneFromText, trackMatchesScene } from "./scenes";

function fold(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Ranked catalog search — lives off App's boot graph (SearchScreen chunk).
 */
export function rankSearchResults(tracks = [], query = "") {
  if (!query) return [];
  const q = fold(query).trim();
  if (!q) return [];
  const energyMatch = q.match(/^e(?:nergy)?\s*(\d+)$/i);
  if (energyMatch) {
    const eVal = parseInt(energyMatch[1], 10);
    return tracks.filter((t) => t.energy === eVal);
  }
  const bpmMatch = q.match(/^(?:bpm)?\s*(\d+)\s*(?:bpm)?$/i);
  const bpmHits = bpmMatch && parseInt(bpmMatch[1], 10) > 50
    ? tracks.filter((t) => t.bpm && Math.abs(t.bpm - parseInt(bpmMatch[1], 10)) <= 5)
    : [];
  const sceneHit = matchSceneFromText(q);
  const scored = [];
  for (const t of tracks) {
    const title = fold(t.title);
    const artist = fold(t.artist);
    const album = fold(t.album);
    const genre = fold(t.genre);
    const sceneLabel = fold(t._scene?.label || displaySceneLabel(t) || "");
    let score = 0;
    if (title === q) score = 120;
    else if (title.startsWith(q)) score = 100;
    else if (title.includes(` ${q}`)) score = 85;
    else if (title.includes(q)) score = 65;
    else if (artist.startsWith(q)) score = 55;
    else if (artist.includes(q)) score = 45;
    else if (album.includes(q)) score = 30;
    else if (genre.includes(q) || sceneLabel.includes(q)) score = 20;
    else if (sceneHit && trackMatchesScene(t, sceneHit.id)) score = 18;
    else if (String(t.bpm || "").includes(q)) score = 10;
    if (score === 0) continue;
    score += (t.liked ? 8 : 0) + Math.min(6, (t.playCount || 0) / 5);
    scored.push([score, t]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const textHits = scored.map(([, t]) => t);
  if (bpmHits.length) {
    const seen = new Set(bpmHits.map((t) => t.id));
    return [...bpmHits, ...textHits.filter((t) => !seen.has(t.id))];
  }
  return textHits;
}

export function searchEntityHits(tracks = [], query = "") {
  if (String(query || "").length <= 1) return { artists: [], albums: [] };
  return searchEntities(tracks, query);
}
