import { CANONICAL_GENRES, normalizeGenre, GENRE_ALIASES, migratePreferredGenres } from './genres';

test('canonical set has the 11 taste lanes', () => {
  expect(CANONICAL_GENRES).toHaveLength(11);
  expect(CANONICAL_GENRES).toEqual([
    'Electronic',
    'Hip-Hop',
    'R&B & Soul',
    'Pop',
    'Rock',
    'Metal',
    'Jazz',
    'Classical',
    'Country & Folk',
    'Reggae',
    'Latin',
  ]);
});

test('normalizeGenre maps aliases into the 11', () => {
  expect(normalizeGenre('techno')).toBe('Electronic');
  expect(normalizeGenre('UK Garage')).toBe('Electronic');
  expect(normalizeGenre('House')).toBe('Electronic');
  expect(normalizeGenre('DnB')).toBe('Electronic');
  expect(normalizeGenre('drum & bass')).toBe('Electronic');
  expect(normalizeGenre('Rap')).toBe('Hip-Hop');
  expect(normalizeGenre('funk')).toBe('R&B & Soul');
  expect(normalizeGenre('Soul')).toBe('R&B & Soul');
  expect(normalizeGenre('R&B')).toBe('R&B & Soul');
  expect(normalizeGenre('indie')).toBe('Rock');
  expect(normalizeGenre('folk')).toBe('Country & Folk');
  expect(normalizeGenre('Country')).toBe('Country & Folk');
  expect(normalizeGenre('dancehall')).toBe('Reggae');
  expect(normalizeGenre('salsa')).toBe('Latin');
  expect(normalizeGenre('afrobeats')).toBe('Pop');
  expect(normalizeGenre('amapiano')).toBe('Electronic');
  expect(normalizeGenre('k-pop')).toBe('Pop');
  expect(normalizeGenre('blues')).toBe('Jazz');
  expect(normalizeGenre('soundtrack')).toBe('Classical');
});

test('normalizeGenre keeps canonical and clears unknown', () => {
  expect(normalizeGenre('Jazz')).toBe('Jazz');
  expect(normalizeGenre('Electronic')).toBe('Electronic');
  expect(normalizeGenre('R&B & Soul')).toBe('R&B & Soul');
  expect(normalizeGenre('')).toBe('');
  expect(normalizeGenre('Completely Fake Genre XYZ')).toBe('');
});

test('aliases cover common legacy labels', () => {
  expect(GENRE_ALIASES.techno).toBe('Electronic');
  expect(GENRE_ALIASES.ambient).toBe('Electronic');
  expect(GENRE_ALIASES.house).toBe('Electronic');
  expect(GENRE_ALIASES.soul).toBe('R&B & Soul');
});

test('migratePreferredGenres collapses legacy prefs', () => {
  expect(migratePreferredGenres(['House', 'Soul', 'Jazz', 'techno'])).toEqual([
    'Electronic',
    'R&B & Soul',
    'Jazz',
  ]);
  expect(migratePreferredGenres(['Drum and Bass', 'Country'])).toEqual([
    'Electronic',
    'Country & Folk',
  ]);
});
