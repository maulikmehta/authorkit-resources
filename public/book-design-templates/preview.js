// Live preview on a template page: the author's text (or the sample) set in
// the template's fonts on a true-scale KDP page, shown as a book: a spread at
// a time where there is room, a page at a time on phones. Pagination is
// paginate.js; this file measures, draws and turns pages.
import { parse, paginate } from '/book-design-templates/paginate.js';
import { Ink, trimsFor, trimId, parseTrim } from '/shared/kdp.js';

const KEY = 'ak-bdt-text';
const PX_PER_IN = 96;
const TURN_MS = 350;
const $ = (id) => document.getElementById(id);
const { template: t, sample } = JSON.parse($('bdt-data').textContent);
const text = $('bdt-text'), title = $('bdt-title'), trim = $('bdt-trim');
const out = $('bdt-pages'), measure = $('bdt-measure'), note = $('bdt-note'), credit = $('bdt-credit');
const turnBar = $('bdt-turn'), back = $('bdt-back'), fwd = $('bdt-fwd'), at = $('bdt-at');
const still = matchMedia('(prefers-reduced-motion: reduce)');

const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ text: text.value, title: title.value })); } catch { /* storage blocked: text lasts for this visit */ } };

const el = (tag, cls, content) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (content !== undefined) n.textContent = content;
  return n;
};
const runs = (rs) => rs.map((r) => (r.italic ? el('em', '', r.text) : document.createTextNode(r.text)));

function blockEl(b) {
  if (b.kind === 'break') return el('p', 'bdt-break', t.ornament === 'blank' ? ' ' : t.ornament);
  const p = el('p', [b.kind === 'verse' && 'bdt-verse', b.cont && 'bdt-cont'].filter(Boolean).join(' '));
  if (b.kind === 'verse') b.lines.forEach((line, i) => { if (i) p.append(el('br')); p.append(...runs(line)); });
  else p.append(...runs(b.runs));
  return p;
}

// The chapter title is the author's; the sample shows only the chapter number.
const heading = () => title.value.trim();
const runningHead = () => heading() || (text.value.trim() ? t.name : sample.title);

function sized(node, [w, h]) {
  node.style.width = `${w}in`;
  node.style.height = `${h}in`;
  return node;
}

function pageEl(i, blocks, size) {
  const m = t.margins;
  const recto = i % 2 === 0; // page 1 is a right-hand page; its inside margin is on the left
  const page = sized(el('div', 'bdt-page'), size);
  page.style.padding = recto
    ? `${m.top}in ${m.outside}in ${m.bottom}in ${m.inside}in`
    : `${m.top}in ${m.inside}in ${m.bottom}in ${m.outside}in`;
  const body = el('div', 'bdt-body');
  if (i === 0) {
    const opener = el('div', 'bdt-opener');
    opener.append(el('span', 'bdt-num', t.number === 'word' ? 'Chapter One' : '1'));
    if (heading()) opener.append(el('span', 'bdt-title', heading()));
    body.append(opener);
  } else {
    page.append(el('div', 'bdt-rh', runningHead()));
  }
  body.append(...blocks.map(blockEl));
  page.append(body, el('div', 'bdt-folio', String(i + 1)));
  return page;
}

// An empty slot beside page 1 or after the last page: the open book's edge, not paper.
const gap = (size) => sized(el('div', 'bdt-page bdt-page--none'), size);

// ── Book viewer ────────────────────────────────────────────────────────────
let pages = [];          // page elements, in order
let size = [5.5, 8.5];
let view = 0;            // index into views()
let busy = false;

// Two pages side by side while a page stays at least 55% of true size.
const cols = () => (out.clientWidth >= 2 * size[0] * PX_PER_IN * 0.55 ? 2 : 1);

// Spreads start with page 1 alone on the right, as in a printed book.
function views() {
  if (cols() === 1) return pages.map((_, i) => [i]);
  const v = [[null, 0]];
  for (let i = 1; i < pages.length; i += 2) v.push([i, i + 1 < pages.length ? i + 1 : null]);
  return v;
}

const slot = (i) => (i === null ? gap(size) : pages[i].cloneNode(true));

function frame() {
  const c = cols();
  const scale = Math.min(1, out.clientWidth / (c * size[0] * PX_PER_IN));
  const stage = el('div', 'bdt-stage');
  stage.style.width = `${c * size[0] * PX_PER_IN * scale}px`;
  stage.style.height = `${size[1] * PX_PER_IN * scale}px`;
  const inner = el('div', 'bdt-scale');
  inner.style.transform = `scale(${scale})`;
  stage.append(inner);
  return { stage, inner };
}

function draw() {
  const v = views();
  view = Math.min(view, Math.max(0, v.length - 1));
  const { stage, inner } = frame();
  if (v.length) inner.append(...v[view].map(slot));
  out.replaceChildren(stage);
  turnBar.hidden = v.length < 2;
  back.disabled = view === 0;
  fwd.disabled = view >= v.length - 1;
  const shown = (v[view] ?? []).filter((i) => i !== null).map((i) => i + 1);
  at.textContent = shown.length > 1 ? `Pages ${shown[0]}–${shown.at(-1)} of ${pages.length}` : `Page ${shown[0] ?? 0} of ${pages.length}`;
}

// Spread: the one leaf that turns swings 180° about the spine, over the pages
// already in place beneath it. Single page: a short slide. Both use
// transform and opacity only, so they stay on the compositor.
async function turn(dir) {
  const v = views();
  const to = view + dir;
  if (busy || to < 0 || to >= v.length) return;
  if (still.matches) { view = to; draw(); return; }
  busy = true;
  const [oldL, oldR] = v[view], [newL, newR] = v[to];
  const { stage, inner } = frame();
  let anim;
  if (cols() === 2) {
    const w = size[0] * PX_PER_IN;
    const leaf = el('div', 'bdt-leaf');
    leaf.style.width = `${w}px`;
    leaf.style.left = dir > 0 ? `${w}px` : '0';
    leaf.style.transformOrigin = dir > 0 ? 'left center' : 'right center';
    const front = el('div', 'bdt-face'), backFace = el('div', 'bdt-face bdt-face--back');
    front.append(slot(dir > 0 ? oldR : oldL));
    backFace.append(slot(dir > 0 ? newL : newR));
    leaf.append(front, backFace);
    inner.append(...(dir > 0 ? [slot(oldL), slot(newR)] : [slot(newL), slot(oldR)]), leaf);
    out.replaceChildren(stage);
    anim = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${dir > 0 ? -180 : 180}deg)` }],
      { duration: TURN_MS, easing: 'cubic-bezier(.45,.05,.35,1)' });
  } else {
    inner.append(slot(newL));
    out.replaceChildren(stage);
    anim = inner.firstChild.animate([{ transform: `translateX(${dir * 12}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 220, easing: 'ease-out' });
  }
  await anim.finished.catch(() => {});
  view = to;
  busy = false;
  draw();
}

back.addEventListener('click', () => turn(-1));
fwd.addEventListener('click', () => turn(1));
document.addEventListener('keydown', (e) => {
  if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
  if (turnBar.hidden) return;
  if (e.key === 'ArrowRight') turn(1);
  if (e.key === 'ArrowLeft') turn(-1);
});
let x0 = null;
out.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
out.addEventListener('pointerup', (e) => {
  if (x0 !== null && Math.abs(e.clientX - x0) > 40) turn(e.clientX < x0 ? 1 : -1);
  x0 = null;
});

// ── Text → pages ───────────────────────────────────────────────────────────
function render() {
  size = parseTrim(trim.value);
  const own = text.value.trim() !== '';
  const blocks = parse(own ? text.value : sample.text, { verse: t.verse });
  const fits = (i, bs) => {
    const p = pageEl(i, bs, size);
    measure.replaceChildren(p);
    const body = p.querySelector('.bdt-body');
    return body.scrollHeight <= body.clientHeight + 1;
  };
  const result = paginate(blocks, fits, 4);
  measure.replaceChildren();
  pages = result.pages.map((bs, i) => pageEl(i, bs, size));
  draw();
  note.textContent = result.truncated ? 'Showing the first 4 pages.' : '';
  if (own) credit.replaceChildren();
  else credit.replaceChildren(`Sample: ${sample.author}, `, el('cite', '', sample.title), ` (${sample.year}), public domain.`);
}

let timer;
const soon = () => { clearTimeout(timer); timer = setTimeout(render, 150); };

for (const tr of trimsFor(Ink.BW_WHITE)) trim.add(new Option(`${tr[0]} × ${tr[1]} in`, trimId(tr)));
trim.value = t.trim;
text.value = saved.text ?? '';
title.value = saved.title ?? '';

text.addEventListener('input', () => { save(); soon(); });
title.addEventListener('input', () => { save(); soon(); });
trim.addEventListener('change', render);
$('bdt-clear').addEventListener('click', () => { text.value = ''; title.value = ''; save(); view = 0; render(); });
let lastCols = 0;
new ResizeObserver(() => {
  if (busy) return;
  // Switching between spread and single page changes what a "view" is; start from page 1's view.
  if (cols() !== lastCols) { lastCols = cols(); view = 0; }
  draw();
}).observe(out);

// Measure with the real fonts, not the fallback; measure again if a face arrives later.
const faces = [
  `${t.size[0]}pt "${t.body.family}"`,
  `italic ${t.size[0]}pt "${t.body.family}"`,
  `${t.heading.weights[0]} ${t.size[0]}pt "${t.heading.family}"`,
];
Promise.all(faces.map((f) => document.fonts.load(f))).catch(() => {}).then(render);
document.fonts.addEventListener('loadingdone', soon);
