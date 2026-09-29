import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatePages, genresFor } from '../public/novel-word-count/wordcount.js';
import { GENRES, WORDS_PER_PAGE } from '../public/novel-word-count/genres.js';

const WPP = { '6x9': 300, '5x8': 250 };

test('80,000 words at 300 per page is 268 pages (rounded up to even)', () => {
  assert.deepEqual(estimatePages('80000', '6x9', WPP), { pages: 268 });
});

test('commas and spaces in the number are accepted', () => {
  assert.deepEqual(estimatePages(' 80,000 ', '6x9', WPP), { pages: 268 });
  assert.deepEqual(estimatePages('80 000', '6x9', WPP), { pages: 268 });
});

test('empty, zero, negative, non-numeric: an error, never NaN', () => {
  for (const s of ['', '  ', '0', '-500', 'abc', '1e999']) {
    const r = estimatePages(s, '6x9', WPP);
    assert.ok(r.error, `no error for ${JSON.stringify(s)}`);
    assert.doesNotMatch(JSON.stringify(r), /NaN|Infinity|undefined/);
  }
});

test('unknown trim is an error', () => {
  assert.ok(estimatePages('80000', '9x12', WPP).error);
});

test('genresFor matches inclusive ranges', () => {
  const g = [{ id: 'a', min: 70000, max: 100000 }, { id: 'b', min: 40000, max: 70000 }];
  assert.deepEqual(genresFor(70000, g).map((x) => x.id), ['a', 'b']);
  assert.deepEqual(genresFor(120000, g), []);
});

test('genresFor treats a null max as no upper bound', () => {
  const g = [{ id: 'open', min: 40000, max: null }];
  assert.deepEqual(genresFor(40000, g).map((x) => x.id), ['open']);
  assert.deepEqual(genresFor(1000000, g).map((x) => x.id), ['open']);
  assert.deepEqual(genresFor(39999, g), []);
});

test('every genre row is sourced and dated; min < max, or max is open-ended', () => {
  assert.ok(GENRES.length > 0);
  for (const r of GENRES) {
    assert.match(r.source, /^https:\/\//, r.id);
    assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/, r.id);
    assert.ok(Number.isInteger(r.min), r.id);
    assert.ok(r.max === null || Number.isInteger(r.max), r.id);
    if (r.max !== null) assert.ok(r.min < r.max, r.id);
  }
});

test('words-per-page keys are KDP trim ids', () => {
  for (const k of Object.keys(WORDS_PER_PAGE)) assert.match(k, /^\d+(\.\d+)?x\d+(\.\d+)?$/);
});
