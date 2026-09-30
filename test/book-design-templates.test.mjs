import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TYPES, matches, answer, fontsHref, fmtTrim, inMm, problems, gaps } from '../public/book-design-templates/catalog.js';

const font = (over = {}) => ({ license: 'OFL-1.1', specimen: 'https://fonts.google.com/specimen/EB+Garamond', weights: [400, 700], italic: true, checked: '2026-09-30', ...over });
const tpl = (over = {}) => ({
  id: 'romance-garden-party', name: 'Garden Party', type: 'novel', genres: ['romance'],
  body: { family: 'EB Garamond', weights: [400], italic: true },
  heading: { family: 'Playfair Display', weights: [700], case: 'none' },
  size: [11, 14.5], number: 'word', initial: 'drop-cap', ornament: '❦',
  margins: { top: 0.75, bottom: 0.75, inside: 0.625, outside: 0.5 },
  trim: '5.5x8.5', verse: false, why: 'A soft old-style body with a high-contrast display face.',
  citation: null, sample: 'austen', ...over,
});
const data = (templates = [tpl()]) => ({
  checked: '2026-09-30',
  ofl: { note: 'n', url: 'https://openfontlicense.org/ofl-faq/', checked: '2026-09-30' },
  fonts: { 'EB Garamond': font(), 'Playfair Display': font({ specimen: 'https://fonts.google.com/specimen/Playfair+Display', weights: [400, 700], italic: false }) },
  templates,
});
const samples = { austen: { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, heading: 'Chapter I', source: 'https://www.gutenberg.org/ebooks/1342', checked: '2026-09-30', text: 'word '.repeat(300) } };

test('a valid template has no problems', () => {
  assert.deepEqual(problems(data(), samples), []);
});

test('problems catches each kind of bad data', () => {
  const cases = [
    [tpl({ id: 'Bad Id' }), /id/],
    [tpl({ type: 'cookbook' }), /type/],
    [tpl({ genres: ['western'] }), /genre/],
    [tpl({ type: 'memoir', genres: ['romance'] }), /genre/],
    [tpl({ body: { family: 'Comic Sans', weights: [400], italic: true } }), /Comic Sans/],
    [tpl({ heading: { family: 'Playfair Display', weights: [900], case: 'none' } }), /900/],
    [tpl({ body: { family: 'Playfair Display', weights: [400], italic: true } }), /italic/],
    [tpl({ size: [11, 10] }), /size/],
    [tpl({ number: 'roman' }), /number/],
    [tpl({ initial: 'fancy' }), /initial/],
    [tpl({ heading: { family: 'Playfair Display', weights: [700], case: 'wavy' } }), /case/],
    [tpl({ trim: '4x4' }), /trim/],
    [tpl({ margins: { top: 0.75, bottom: 0.75, inside: 0.3, outside: 0.5 } }), /inside/],
    [tpl({ margins: { top: 0.2, bottom: 0.75, inside: 0.625, outside: 0.5 } }), /top/],
    [tpl({ sample: 'nope' }), /sample/],
    [tpl({ citation: { book: 'X' } }), /citation/],
    [tpl({ why: '' }), /why/],
  ];
  for (const [t, re] of cases) {
    const p = problems(data([t]), samples);
    assert.ok(p.some((m) => re.test(m)), `${re} not reported: ${JSON.stringify(p)}`);
  }
});

test('duplicate ids are a problem', () => {
  assert.ok(problems(data([tpl(), tpl()]), samples).some((m) => /duplicate/.test(m)));
});

test('a font not under OFL is a problem', () => {
  const d = data();
  d.fonts['EB Garamond'].license = 'Apache-2.0';
  assert.ok(problems(d, samples).some((m) => /OFL/.test(m)));
});

test('gaps lists every type and genre with no template', () => {
  const g = gaps(data());
  assert.ok(g.includes('novel/literary'));
  assert.ok(g.includes('memoir'));
  assert.ok(!g.includes('novel/romance'));
});

test('matches: empty means any; genre narrows', () => {
  const t = { type: 'novel', genres: ['romance'] };
  assert.equal(matches(t, '', ''), true);
  assert.equal(matches(t, 'novel', ''), true);
  assert.equal(matches(t, 'novel', 'romance'), true);
  assert.equal(matches(t, 'novel', 'cozy'), false);
  assert.equal(matches(t, 'memoir', ''), false);
});

test('every type with genres has unique genre ids', () => {
  for (const t of TYPES) assert.equal(new Set(t.genres.map(([id]) => id)).size, t.genres.length);
});

test('answer reads as a direct recommendation', () => {
  assert.equal(answer(tpl()),
    'For a romance novel in paperback, set the body in EB Garamond at 11/14.5 pt and chapter titles in Playfair Display, on a 5.5 × 8.5 in trim. A soft old-style body with a high-contrast display face.');
  assert.match(answer(tpl({ type: 'memoir', genres: [] })), /^For a memoir in paperback/);
});

test('fontsHref merges a family listed twice and sorts axes', () => {
  const href = fontsHref([
    { family: 'Source Serif 4', weights: [500, 400], italic: true },
    { family: 'Source Serif 4', weights: [700] },
    { family: 'Oswald', weights: [600] },
  ]);
  assert.equal(href, 'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,500;0,700;1,400&family=Oswald:wght@600&display=swap');
});

test('fontsHref adds a text= subset when given', () => {
  assert.match(fontsHref([{ family: 'Oswald', weights: [600] }], 'Ab c'), /&text=Ab%20c&display=swap$/);
});

test('fmtTrim and inMm', () => {
  assert.equal(fmtTrim('5.5x8.5'), '5.5 × 8.5 in');
  assert.equal(inMm(0.5), '12.7 mm');
});

import { readFileSync } from 'node:fs';
const DIR = new URL('../public/book-design-templates/', import.meta.url);
const real = JSON.parse(readFileSync(new URL('templates.json', DIR), 'utf8'));
const realSamples = JSON.parse(readFileSync(new URL('samples.json', DIR), 'utf8'));

test('templates.json passes every rule', () => {
  assert.deepEqual(problems(real, realSamples), []);
});

test('every book type and genre has a template', () => {
  assert.deepEqual(gaps(real), []);
});

test('every sample is 250-450 words with its source and date', () => {
  for (const [key, s] of Object.entries(realSamples)) {
    const words = s.text.split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 250 && words <= 450, `${key}: ${words} words`);
    assert.match(s.source, /^https:\/\/www\.gutenberg\.org\//, key);
    assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, key);
    assert.ok(s.title && s.author && s.year < 1929 && s.heading, key);
  }
});

import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { render } from '../scripts/build-templates.mjs';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const built = render();

test('committed pages match the data (run npm run build:templates)', () => {
  for (const [p, content] of Object.entries(built)) {
    assert.ok(existsSync(join(PUB, p)), `${p} missing`);
    assert.equal(readFileSync(join(PUB, p), 'utf8'), content, `${p} is stale`);
  }
});

test('no template folder is left over from a removed template', () => {
  const dirs = readdirSync(join(PUB, 'book-design-templates'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const d of dirs) assert.ok(built[`book-design-templates/${d}/index.html`], `${d} is not in templates.json`);
});

test('generated pages copy the favicon line whole, so the viewport meta is not swallowed', () => {
  const icon = readFileSync(join(PUB, 'cover-calculator/index.html'), 'utf8').match(/<link rel="icon" href="[^"]*">/)[0];
  for (const [p, html] of Object.entries(built)) {
    if (!p.endsWith('.html')) continue;
    assert.ok(html.includes(`${icon}\n<meta name="viewport"`), `${p}: favicon line broken`);
  }
});

test('prev/next links on each inner page walk every template once', () => {
  const nextOf = (id) => built[`book-design-templates/${id}/index.html`].match(/<a href="\/book-design-templates\/([^/"]+)\/"[^>]*rel="next">/)[1];
  const seen = new Set();
  let id = real.templates[0].id;
  do { seen.add(id); id = nextOf(id); } while (!seen.has(id));
  assert.equal(seen.size, real.templates.length);
  for (const t of real.templates) assert.match(built[`book-design-templates/${t.id}/index.html`], /rel="prev"/, t.id);
});

test('generated pages use the brand arrow classes, not arrow characters', () => {
  for (const [p, html] of Object.entries(built)) assert.doesNotMatch(html, /[←→↗]/, p);
});

test('samples carry no Gutenberg illustration captions or bracketed notes', () => {
  for (const [key, s] of Object.entries(realSamples)) assert.doesNotMatch(s.text, /\[Illustration|\[_?Copyright/, key);
});
