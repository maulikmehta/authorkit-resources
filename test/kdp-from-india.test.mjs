import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/kdp-from-india/index.html', import.meta.url), 'utf8');

test('draft banner stays until a CA has reviewed tax and GST', () => {
  assert.match(html, /class="ak-draft"[^>]*data-status="draft"/);
});

test('says it is not tax advice', () => {
  assert.match(html, /not tax or legal advice/i);
});

test('links to the royalty calculator', () => {
  assert.match(html, /href="\/kdp-royalty-calculator\/"/);
});

test('no vendor prices in the comparison (later plan)', () => {
  const main = html.match(/<main[\s\S]*<\/main>/)[0];
  assert.doesNotMatch(main, /₹\s?\d|Rs\.?\s?\d|INR\s?\d/);
});

test('every external source in the sources list is https', () => {
  const src = html.match(/<section class="ak-sources"[\s\S]*?<\/section>/)[0];
  const links = [...src.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.length >= 4, 'expected at least four sources');
  for (const l of links) assert.match(l, /^https:\/\//);
});

test('discloses that AuthorKit offers self-publishing services', () => {
  assert.match(html, /AuthorKit, which runs this site, offers self-publishing services\./);
});
