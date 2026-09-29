import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GENRES } from '../public/novel-word-count/genres.js';

const html = readFileSync(new URL('../public/novel-word-count/index.html', import.meta.url), 'utf8');
// data-max="" marks an open-ended row (source states no upper bound).
const rows = [...html.matchAll(/<tr data-genre="([^"]+)" data-min="(\d+)" data-max="(\d*)">([\s\S]*?)<\/tr>/g)];

test("the page's genre table is HTML and matches GENRES row for row", () => {
  assert.deepEqual(
    rows.map(([, id, min, max, body]) => ({
      id,
      min: +min,
      max: max === '' ? null : +max,
      source: body.match(/href="([^"]+)"/)?.[1],
    })),
    GENRES.map(({ id, min, max, source }) => ({ id, min, max, source })),
  );
});

test('each row shows its numbers with thousands commas, or says "or more" when open-ended', () => {
  const f = (n) => Number(n).toLocaleString('en-US');
  for (const [, id, min, max, body] of rows) {
    assert.ok(body.includes(f(min)), id);
    if (max === '') assert.match(body, /or more/, id);
    else assert.ok(body.includes(f(max)), id);
  }
});
