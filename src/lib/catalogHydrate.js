/**
 * Scene + signal enrichment — imported dynamically after first paint so
 * Home shelves can render lite tracks before the full trait pass.
 */
export async function hydrateCatalogTracks(tracks = []) {
  const [{ computeSignalTraits }, { enrichTracksWithScenes }] = await Promise.all([
    import("./engine"),
    import("./scenes"),
  ]);
  return computeSignalTraits(enrichTracksWithScenes(tracks));
}
