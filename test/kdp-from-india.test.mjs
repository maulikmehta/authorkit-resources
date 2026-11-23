import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, checklistText } from '../public/kdp-from-india/checklist.js';

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

test('every checklist item has unique id, all required fields, and valid source', () => {
  assert.ok(ITEMS.length >= 6);
  const ids = ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  const srcs = html.match(/<section class="ak-sources"[\s\S]*?<\/section>/)[0];
  const hrefs = new Set([...srcs.matchAll(/href="([^"#]+)/g)].map((m) => m[1]));
  for (const item of ITEMS) {
    for (const field of ['id', 'title', 'detail', 'quote', 'source', 'sourceTitle']) {
      assert.ok(typeof item[field] === 'string' && item[field].trim().length > 0, `${item.id}: missing ${field}`);
    }
    assert.ok(hrefs.has(item.source.split('#')[0]), `${item.id}: source not on page`);
  }
});

test('no digits in item titles or details', () => {
  const FORM = /\b(?:Form\s+[A-Z]*-?\d+[A-Z]*|[A-Z]+-?\d+[A-Z]*)\b/g;
  for (const item of ITEMS) {
    const text = (item.title + ' ' + item.detail).replace(FORM, '');
    assert.doesNotMatch(text, /\d/, item.id);
  }
});

test('checklistText formats all items with checkboxes, quotes, and sources', () => {
  const txt = checklistText(ITEMS);
  assert.ok((txt.match(/\[ \]/g) || []).length >= ITEMS.length);
  for (const item of ITEMS) {
    assert.ok(txt.includes(item.title), item.id);
    assert.ok(txt.includes(item.quote), item.id);
    assert.ok(txt.includes(item.source), item.id);
  }
});

