import { normalizeGenre, CANONICAL_GENRES, GENRE_ALIASES } from './genres';

// eslint-disable-next-line import/no-commonjs
const shared = require('./genre-normalize.shared.cjs');

test('shared alias table matches app re-export', () => {
  expect(shared.CANONICAL_GENRES).toEqual(CANONICAL_GENRES);
  expect(shared.GENRE_ALIASES).toEqual(GENRE_ALIASES);
  expect(shared.normalizeGenre('techno')).toBe(normalizeGenre('techno'));
  expect(shared.normalizeGenre('House')).toBe('Electronic');
});
