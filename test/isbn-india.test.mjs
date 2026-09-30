import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/isbn-india/index.html', import.meta.url), 'utf8');
const main = html.match(/<main[\s\S]*<\/main>/)[0];

test('draft banner stays until RRRNA answers', () => {
  assert.match(html, /class="ak-draft"[^>]*data-status="draft"/);
});

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
