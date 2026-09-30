// Writes each calculator's default result into its static HTML, so readers
// without JavaScript, crawlers and AI search see real numbers. The page
// script recomputes the same values on load. After a change to kdp.js or a
// page's defaults: npm run prerender (test/prerender.test.mjs checks it).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { INK_ALL, INK_LABELS, trimsFor, trimId, parseTrim, pageLimits } from '../public/shared/kdp.js';
import { fmt, INK_SHORT } from '../public/shared/ui.js';
import { coverResult } from '../public/cover-calculator/cover.js';
import { royaltyResult } from '../public/kdp-royalty-calculator/royalty.js';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace the contents of the element with this id (no nested element of the same tag inside).
function fill(html, id, inner) {
  const re = new RegExp(`(<(\\w+)\\b[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);
  if (!re.test(html)) throw new Error(`no element #${id}`);
  return html.replace(re, (_, open, _tag, close) => open + inner + close);
}

const inkOptions = (sel) => INK_ALL.map((i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${esc(INK_SHORT[i])}</option>`).join('');
const trimOptions = (ink, sel) => trimsFor(ink).map((t) => {
  const id = trimId(t);
  return `<option value="${id}"${id === sel ? ' selected' : ''}>${t[0]}″ × ${t[1]}″</option>`;
}).join('');
const limits = (ink, trim) => {
  const [min, max] = pageLimits(ink, parseTrim(trim));
  return `KDP prints ${min} to ${max} pages for this paper and trim.`;
};

// Defaults: the same values each page script starts from.
const INK = 'bw-cream', TRIM = '6x9', PAGES = '300', LIST = '14.99';

function cover(html) {
  const r = coverResult(INK, TRIM, PAGES);
  const [w, h] = r.wrap;
  const rows = [];
  for (const n of [100, 200, 300]) for (const [id, paper] of [['bw-cream', 'Cream'], ['bw-white', 'White']]) {
    const x = coverResult(id, '6x9', String(n));
    rows.push(`<tr><td>${n}</td><td>${paper}</td><td class="ak-val">${x.spine.toFixed(3)}</td><td class="ak-val">${x.wrap[0].toFixed(3)}</td></tr>`);
  }
  const cells = {
    ink: inkOptions(INK),
    trim: trimOptions(INK, TRIM),
    'ink-kdp': esc(`KDP calls this: ${INK_LABELS[INK]}`),
    limits: esc(limits(INK, TRIM)),
    headline: `<span>${w.toFixed(3)} × ${h.toFixed(3)} in</span> <span>(${(w * 25.4).toFixed(1)} × ${(h * 25.4).toFixed(1)} mm)</span>`,
    'wrap-w': fmt(w),
    'wrap-h': fmt(h),
    spine: fmt(r.spine),
    panel: `${fmt(r.trim[0])} × ${fmt(r.trim[1])}`,
    'spine-text': r.spineText ? 'Allowed (more than 79 pages)' : 'Not allowed (79 pages or fewer)',
    barcode: `${fmt(r.barcode[0])} × ${fmt(r.barcode[1])}, kept clear by KDP`,
    gutter: fmt(r.gutter),
    outside: `${fmt(r.outside[0])} without bleed, ${fmt(r.outside[1])} with bleed`,
  };
  for (const [id, v] of Object.entries(cells)) html = fill(html, id, v);
  return html.replace(/(<table class="ak-results" id="example">[\s\S]*?<tbody>)[\s\S]*?(<\/tbody>)/, `$1${rows.join('')}$2`);
}

function royalty(html) {
  const r = royaltyResult({ ink: INK, trim: TRIM, pages: PAGES, list: LIST, fx: '' });
  const usd = (v) => `$${v.toFixed(2)}`;
  const cells = {
    ink: inkOptions(INK),
    trim: trimOptions(INK, TRIM),
    'ink-kdp': esc(`KDP calls this: ${INK_LABELS[INK]}`),
    limits: esc(limits(INK, TRIM)),
    'min-list': esc(`KDP's minimum list price for this book is ${usd(r.minList)}.`),
    'r-cost': usd(r.printCost),
    'r-rate': `${(r.rate * 100).toFixed(0)}%`,
    'r-royalty': usd(r.royalty),
    'r-withhold': `−${usd(r.withholding)}`,
    'r-net': usd(r.net),
    'r-exp-royalty': r.expanded ? usd(r.expanded.royalty) : 'Not available at this price (would be $0 or less)',
    'r-exp-withhold': r.expanded ? `−${usd(r.expanded.withholding)}` : '—',
    'r-exp-net': r.expanded ? usd(r.expanded.net) : '—',
  };
  for (const [id, v] of Object.entries(cells)) html = fill(html, id, v);
  return html;
}

const PAGES_OUT = { 'cover-calculator/index.html': cover, 'kdp-royalty-calculator/index.html': royalty };

export function render() {
  return Object.fromEntries(Object.entries(PAGES_OUT).map(([p, f]) => [p, f(readFileSync(PUB + p, 'utf8'))]));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [p, html] of Object.entries(render())) writeFileSync(PUB + p, html);
  console.log('prerendered', Object.keys(PAGES_OUT).join(', '));
}
