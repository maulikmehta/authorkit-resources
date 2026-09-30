import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GENRES } from '../public/novel-word-count/genres.js';

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
