import { CANONICAL_GENRES, normalizeGenre, GENRE_ALIASES } from './genres';

test('canonical set has expected size', () => {
  expect(CANONICAL_GENRES).toHaveLength(10);
  expect(CANONICAL_GENRES).toContain('Drum and Bass');
  expect(CANONICAL_GENRES).toContain('Classical');
});

test('normalizeGenre maps aliases', () => {
  expect(normalizeGenre('techno')).toBe('House');
  expect(normalizeGenre('UK Garage')).toBe('House');
  expect(normalizeGenre('DnB')).toBe('Drum and Bass');
  expect(normalizeGenre('drum & bass')).toBe('Drum and Bass');
  expect(normalizeGenre('Rap')).toBe('Hip-Hop');
  expect(normalizeGenre('funk')).toBe('Soul');
  expect(normalizeGenre('indie')).toBe('Rock');
  expect(normalizeGenre('folk')).toBe('Country');
});

test('normalizeGenre keeps canonical and clears unknown', () => {
  expect(normalizeGenre('Jazz')).toBe('Jazz');
  expect(normalizeGenre('R&B')).toBe('R&B');
  expect(normalizeGenre('')).toBe('');
  expect(normalizeGenre('Completely Fake Genre XYZ')).toBe('');
});

test('aliases cover common legacy labels', () => {
  expect(GENRE_ALIASES.techno).toBe('House');
  expect(GENRE_ALIASES.ambient).toBe('House');
});
