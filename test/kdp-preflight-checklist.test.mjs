import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ITEMS, UNSOURCED, marginsFor, progress } from '../public/kdp-preflight-checklist/checklist.js';

// ponytail: only checks when authorkit-studio is checked out next to this repo (same as fixture-sync).
const rs = new URL('../../authorkit-studio/code/lib/core/src/preflight.rs', import.meta.url);
const kebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

test('one item per preflight.rs Check variant (or listed as unsourced)', { skip: !existsSync(rs) && 'authorkit-studio not next to this repo' }, () => {
  const src = readFileSync(rs, 'utf8');
  const body = src.match(/pub enum Check \{([\s\S]*?)\}/)[1];
  const variants = [...body.matchAll(/^\s*([A-Z]\w*),/gm)].map((m) => kebab(m[1])).sort();
  const items = [...ITEMS.map((i) => i.check).filter(Boolean), ...UNSOURCED].sort();
  assert.deepEqual(items, variants);
});

test('every item has a unique id, its own KDP source with a real anchor, and a quote', () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  for (const i of ITEMS) {
    assert.match(i.source, /^https:\/\/kdp\.amazon\.com\/en_US\/help\/topic\/[A-Z0-9]+#[a-z]+$/, i.id);
    assert.ok(i.quote.length > 20, i.id);
  }
});

test('no hand-typed KDP numbers in item titles or details (numbers live in the quote)', () => {
  for (const i of ITEMS) assert.doesNotMatch(`${i.title} ${i.detail}`, /\d+(\.\d+)?\s?(″|"|in\b|inch|mm|ppi|dpi|pages)/, i.id);
});

test('margins for 300 pages come from shared/kdp.js', () => {
  const m = marginsFor('300');
  assert.match(m.gutter, /^0\.500″/);
  assert.match(m.bleed, /^0\.125″/);
});

test('bad page count is an error, never NaN', () => {
  for (const p of ['', 'x', '0', '-2', '12abc', '3.5', undefined]) {
    const m = marginsFor(p);
    assert.ok(m.error, String(p));
    assert.doesNotMatch(JSON.stringify(m), /NaN|undefined/);
  }
});

test('progress counts only known ids', () => {
  assert.deepEqual(progress(new Set([ITEMS[0].id, 'nope'])), { done: 1, total: ITEMS.length });
});
