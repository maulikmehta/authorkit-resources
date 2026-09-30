import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../scripts/seo.mjs';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const files = render();

test('head blocks and sitemap are current (run npm run seo)', () => {
  for (const [rel, content] of Object.entries(files)) assert.equal(readFileSync(PUB + rel, 'utf8'), content, `${rel} is stale`);
});

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const pages = walk(PUB).filter((p) => p.endsWith('index.html'));

for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  const name = p.slice(PUB.length);
  test(`${name}: Open Graph tags and valid JSON-LD`, () => {
    for (const prop of ['og:title', 'og:description', 'og:url']) assert.match(html, new RegExp(`<meta property="${prop}" content="[^"]+"`), prop);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(blocks.length, 'no JSON-LD');
    const types = blocks.flatMap((b) => b['@graph'] ?? [b]).map((n) => n['@type']);
    if (name !== 'index.html') assert.ok(types.includes('BreadcrumbList'), `${name}: no BreadcrumbList`);
  });
  if (name !== 'index.html') {
    test(`${name}: the verified date is a <time>`, () => {
      assert.match(html, /<time data-verified="(\d{4}-\d{2}-\d{2})" datetime="\1">\1<\/time>/);
    });
  }
}

test('sitemap has a lastmod for every page', () => {
  const xml = files['sitemap.xml'];
  assert.equal((xml.match(/<url>/g) ?? []).length, pages.length);
  assert.equal((xml.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) ?? []).length, pages.length);
});
