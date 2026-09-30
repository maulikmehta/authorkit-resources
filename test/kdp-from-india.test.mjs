import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/kdp-from-india/index.html', import.meta.url), 'utf8');

test('the banner says it is not tax or legal advice', () => {
  assert.match(html, /<p class="ak-draft" role="note">This is not tax or legal advice\.<\/p>/);
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

test('does not mention AuthorKit services', () => {
  assert.doesNotMatch(html, /offers self-publishing services/);
});
