// Live preview on a template page: the author's text (or the sample) set in
// the template's fonts on a true-scale KDP page. Pagination is paginate.js;
// this file only measures and draws.
import { parse, paginate } from '/book-design-templates/paginate.js';
import { Ink, trimsFor, trimId, parseTrim } from '/shared/kdp.js';

const KEY = 'ak-bdt-text';
const PX_PER_IN = 96;
const $ = (id) => document.getElementById(id);
const { template: t, sample } = JSON.parse($('bdt-data').textContent);
const text = $('bdt-text'), title = $('bdt-title'), trim = $('bdt-trim'), spread = $('bdt-spread');
const out = $('bdt-pages'), measure = $('bdt-measure'), note = $('bdt-note'), credit = $('bdt-credit');

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

function pageEl(i, blocks, [w, h]) {
  const m = t.margins;
  const recto = i % 2 === 0; // page 1 is a right-hand page; its inside margin is on the left
  const page = el('div', 'bdt-page');
  page.style.width = `${w}in`;
  page.style.height = `${h}in`;
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

function blank([w, h]) {
  const page = el('div', 'bdt-page bdt-page--blank');
  page.style.width = `${w}in`;
  page.style.height = `${h}in`;
  return page;
}

let last = { pages: [], size: [5.5, 8.5] };

function layout() {
  const { pages, size } = last;
  const [w, h] = size;
  const cols = spread.checked ? 2 : 1;
  const rows = [];
  if (spread.checked) {
    rows.push([blank(size), pages[0]]);
    for (let i = 1; i < pages.length; i += 2) rows.push([pages[i], pages[i + 1] ?? blank(size)]);
  } else {
    for (const p of pages) rows.push([p]);
  }
  const scale = Math.min(1, out.clientWidth / (w * PX_PER_IN * cols));
  out.replaceChildren(...rows.filter((r) => r[0] || r[1]).map((row) => {
    const r = el('div', 'bdt-row');
    r.style.width = `${w * PX_PER_IN * cols * scale}px`;
    r.style.height = `${h * PX_PER_IN * scale}px`;
    const inner = el('div', 'bdt-scale');
    inner.style.transform = `scale(${scale})`;
    inner.append(...row.filter(Boolean));
    r.append(inner);
    return r;
  }));
}

function render() {
  const size = parseTrim(trim.value);
  const own = text.value.trim() !== '';
  const blocks = parse(own ? text.value : sample.text, { verse: t.verse });
  const fits = (i, bs) => {
    const p = pageEl(i, bs, size);
    measure.replaceChildren(p);
    const body = p.querySelector('.bdt-body');
    return body.scrollHeight <= body.clientHeight + 1;
  };
  const { pages, truncated } = paginate(blocks, fits, 4);
  measure.replaceChildren();
  last = { pages: pages.map((bs, i) => pageEl(i, bs, size)), size };
  layout();
  note.textContent = truncated ? 'Showing the first 4 pages.' : '';
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
spread.addEventListener('change', layout);
$('bdt-clear').addEventListener('click', () => { text.value = ''; title.value = ''; save(); render(); });
new ResizeObserver(layout).observe(out);

// Measure with the real fonts, not the fallback; measure again if a face arrives later.
const faces = [
  `${t.size[0]}pt "${t.body.family}"`,
  `italic ${t.size[0]}pt "${t.body.family}"`,
  `${t.heading.weights[0]} ${t.size[0]}pt "${t.heading.family}"`,
];
Promise.all(faces.map((f) => document.fonts.load(f))).catch(() => {}).then(render);
document.fonts.addEventListener('loadingdone', soon);
