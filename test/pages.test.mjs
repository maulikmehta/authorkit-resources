import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const SITE = 'https://resources.authorkit.pro/';

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const pages = walk(ROOT).filter((p) => p.endsWith('.html') && !p.endsWith('404.html'));

// Standard disclaimer appearing on every page (except 404).
const DISCLAIMER = '<p class="ak-disclaimer">These tools and guides are for information only. Check requirements with KDP, and ask a qualified professional about tax or legal questions. AuthorKit is not affiliated with Amazon.</p>';

// Cloudflare Pages pretty URLs: index.html -> /, x/index.html -> /x/, x.html -> /x
function urlOf(file) {
  const r = relative(ROOT, file).split(sep).join('/').replace(/\.html$/, '');
  if (r === 'index') return SITE;
  return SITE + r.replace(/\/index$/, '/');
}

// A local path resolves if the file, path.html or path/index.html exists.
function target(fromFile, ref) {
  const clean = ref.split(/[?#]/)[0];
  const abs = clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(fromFile), clean);
  return [abs, abs + '.html', join(abs, 'index.html')].find((p) => existsSync(p) && statSync(p).isFile());
}

// The tool folder a file belongs to ('' for the hub and shared files).
// Sidebar order on every page (README "Page skeleton"). A folder under public/
// with an index.html must be listed here and linked from every page's sidebar.
const RESOURCES = [
  'cover-calculator', 'novel-word-count', 'kdp-royalty-calculator', 'kdp-from-india',
  'isbn-india', 'copyright-page-generator', 'kdp-preflight-checklist',
  'book-design-templates', 'book-description-formatter', 'isbn-barcode-generator',
];
const existing = readdirSync(ROOT).filter((n) => n !== 'shared' && existsSync(join(ROOT, n, 'index.html')));

test('every resource folder is in the sidebar list', () => {
  for (const f of existing) assert.ok(RESOURCES.includes(f), `${f} missing from RESOURCES`);
});

const toolOf = (file) => {
  const first = relative(ROOT, file).split(sep)[0];
  return first.includes('.') || first === 'shared' ? '' : first;
};

test('a 404 page exists so unknown URLs are not served the hub', () => {
  assert.ok(existsSync(join(ROOT, '404.html')));
});

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const name = relative(ROOT, file);

  test(`${name}: title, description, canonical`, () => {
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canon, 'missing canonical');
    assert.equal(canon[1], urlOf(file));
  });

  test(`${name}: local links and imports resolve`, () => {
    const refs = [...html.matchAll(/(?:href|src)="([^"]+)"|from '([^']+)'/g)].map((m) => m[1] ?? m[2])
      .filter((r) => !/^(https?:|mailto:|data:|#)/.test(r) && r.split(/[?#]/)[0]);
    for (const r of refs) assert.ok(target(file, r), `broken link ${r}`);
  });

  test(`${name}: code comes only from its own folder and shared/`, () => {
    // Links between resources are welcome; code imports across tool folders are not.
    const code = [...html.matchAll(/src="([^"]+)"|from '([^']+)'/g)].map((m) => m[1] ?? m[2])
      .filter((r) => !/^(https?:|data:)/.test(r));
    const own = toolOf(file);
    for (const r of code) {
      const other = toolOf(target(file, r));
      assert.ok(other === '' || other === own, `${r} imports code from another tool's folder`);
    }
  });

  if (name !== 'index.html') {
    test(`${name}: carries a last-verified date`, () => {
      assert.match(html, /data-verified="\d{4}-\d{2}-\d{2}"/);
    });

    test(`${name}: has a Related section with at least one link`, () => {
      const related = html.match(/<nav class="related"[^>]*>([\s\S]*?)<\/nav>/);
      assert.ok(related, 'missing <nav class="related">');
      assert.match(related[1], /<a href="[^"]+"/);
    });

    test(`${name}: sidebar links every resource in order, marks its own`, () => {
      const aside = html.match(/<aside\b[^>]*>([\s\S]*?)<\/aside>/);
      assert.ok(aside, 'missing <aside> sidebar');
      const nav = aside[1].match(/<nav class="related"[^>]*>([\s\S]*?)<\/nav>/);
      assert.ok(nav, 'sidebar has no <nav class="related">');
      const links = [...nav[1].matchAll(/<a href="\/([^"/]+)\/"([^>]*)>/g)];
      const want = RESOURCES.filter((f) => existing.includes(f));
      assert.deepEqual(links.map((m) => m[1]), want);
      const own = toolOf(file);
      for (const [, f, attrs] of links) {
        assert.equal(/aria-current="page"/.test(attrs), f === own, `aria-current on ${f}`);
      }
    });
  }

  test(`${name}: carries the standard disclaimer exactly once`, () => {
    const matches = [...html.matchAll(new RegExp(DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))];
    assert.equal(matches.length, 1, `expected 1 disclaimer, found ${matches.length}`);
  });

  if (html.includes('ak-sources')) {
    test(`${name}: disclaimer appears after sources`, () => {
      const disclaimerIdx = html.indexOf(DISCLAIMER);
      const sourcesIdx = html.indexOf('ak-sources');
      assert.ok(disclaimerIdx > sourcesIdx, 'disclaimer should appear after sources');
    });
  }
}

test('sitemap lists exactly the pages', () => {
  const xml = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  assert.deepEqual(listed, pages.map(urlOf).sort());
});
