import { normalizeGenre, migratePreferredGenres, CANONICAL_GENRES } from './genres';

// eslint-disable-next-line import/no-commonjs
const shared = require('./genre-normalize.shared.cjs');

const SAMPLES = [
  '',
  'Techno',
  'House',
  'Soul',
  'Drum and Bass',
  'R&B & Soul',
  'Afrobeats',
  'Completely Fake Genre XYZ',
];

test('shared alias table matches app (Node scripts ↔ bundle)', () => {
  expect(shared.CANONICAL_GENRES).toEqual(CANONICAL_GENRES);
  SAMPLES.forEach((g) => {
    expect(shared.normalizeGenre(g)).toBe(normalizeGenre(g));
  });
  expect(shared.migratePreferredGenres(['House', 'Jazz', 'techno'])).toEqual(
    migratePreferredGenres(['House', 'Jazz', 'techno'])
  );
});
