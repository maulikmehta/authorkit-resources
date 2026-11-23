import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ITEMS, checklistText } from '../public/isbn-india/checklist.js';

const html = readFileSync(new URL('../public/isbn-india/index.html', import.meta.url), 'utf8');
const main = html.match(/<main[\s\S]*<\/main>/)[0];

test('cites the Indian agency portal', () => {
  assert.match(html, /href="https:\/\/isbn\.gov\.in[^"]*"/);
});

test('does not mention AuthorKit services', () => {
  assert.doesNotMatch(main, /AuthorKit assigns ISBNs/);
});

test('no foreign agency list', () => {
  for (const d of ['afnil.org', 'german-isbn.de', 'nlsa.ac.za', 'bac-lac.gc.ca', 'myidentifiers.com.au', 'nielsenisbnstore.com']) {
    assert.ok(!html.includes(d), d);
  }
});

test('barcode link uses the live slug, not the 404 one', () => {
  assert.match(html, /kindlepreneur\.com\/isbn-bar-code-generator\//);
  assert.doesNotMatch(html, /isbn-barcode-generator\/"/);
});

test('RRRNA is not claimed to hold questions', () => {
  assert.doesNotMatch(main, /are with RRRNA|isbn-mhrd/);
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

