// Book design templates: the catalog's vocabulary and rules. Pure: used by
// the generator (Node) and by the gallery page (browser).
import { Ink, isOffered, parseTrim, gutterIn, outsideMarginMinIn } from '../shared/kdp.js';
import { parse } from './paginate.js';

export const TYPES = [
  { id: 'novel', label: 'Novel', noun: 'novel', genres: [
    ['literary', 'Literary', 'literary'],
    ['romance', 'Romance', 'romance'],
    ['mystery', 'Mystery/Thriller', 'mystery or thriller'],
    ['fantasy-sf', 'Fantasy/SF', 'fantasy or science fiction'],
    ['historical', 'Historical', 'historical'],
    ['cozy', 'Cozy', 'cozy'],
    ['ya', 'YA', 'young adult'],
  ] },
  { id: 'nonfiction', label: 'Non-fiction', noun: 'book', genres: [
    ['self-help', 'Self-help/Business', 'self-help or business'],
    ['narrative', 'Narrative', 'narrative non-fiction'],
  ] },
  { id: 'memoir', label: 'Memoir', noun: 'memoir', genres: [] },
  { id: 'poetry', label: 'Poetry', noun: 'poetry collection', genres: [] },
  { id: 'children', label: "Children's", noun: "children's chapter book", genres: [] },
];

/** The site's own fonts, loaded on every page (same axes as cover-calculator's <head>). */
export const SITE_FONTS = [
  { family: 'Playfair Display', weights: [600, 700], italic: true },
  { family: 'Source Serif 4', weights: [400, 500], italic: true },
];

/** The preview's margins assume a book of this many pages (spec §8). */
export const PAGES_ASSUMED = 300;

const NUMBERS = ['numeral', 'word'];
const INITIALS = ['none', 'drop-cap', 'small-caps'];
const CASES = ['upper', 'small-caps', 'none'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const typeOf = (t) => TYPES.find((x) => x.id === t.type);
export const genreOf = (t) => typeOf(t)?.genres.find(([id]) => id === t.genres[0]);
export const matches = (t, type, genre) => (!type || t.type === type) && (!genre || t.genres.includes(genre));

export const fmtTrim = (id) => parseTrim(id).join(' × ') + ' in';
export const inMm = (inches) => `${+(inches * 25.4).toFixed(1)} mm`;

export function answer(t) {
  const what = genreOf(t) ? `${genreOf(t)[2]} ${typeOf(t).noun}` : typeOf(t).noun;
  return `For a ${what} in paperback, set the body in ${t.body.family} at ${t.size[0]}/${t.size[1]} pt`
    + ` and chapter titles in ${t.heading.family}, on a ${fmtTrim(t.trim)} trim. ${t.why}`;
}

/** One Google Fonts css2 URL; a family listed twice gets the union of its axes. */
export function fontsHref(specs, text) {
  const fams = new Map();
  for (const { family, weights = [400], italic = false } of specs) {
    const f = fams.get(family) ?? { w: new Set(), i: false };
    for (const w of weights) f.w.add(w);
    f.i ||= italic;
    fams.set(family, f);
  }
  const parts = [...fams].map(([name, { w, i }]) => {
    const ws = [...w].sort((a, b) => a - b);
    const axes = i ? `ital,wght@${[...ws.map((x) => `0,${x}`), '1,400'].join(';')}` : `wght@${ws.join(';')}`;
    return `family=${name.replace(/ /g, '+')}:${axes}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join('&')}${text ? `&text=${encodeURIComponent(text)}` : ''}&display=swap`;
}

/** Every rule the data must meet; the generator refuses to write while any fail. */
export function problems(data, samples) {
  const out = [];
  const say = (t, m) => out.push(`${t.id ?? '?'}: ${m}`);
  for (const [name, f] of Object.entries(data.fonts)) {
    if (f.license !== 'OFL-1.1') out.push(`font ${name}: licence must be OFL-1.1`);
    if (!f.specimen?.startsWith('https://fonts.google.com/specimen/')) out.push(`font ${name}: specimen URL`);
    if (!DATE.test(f.checked ?? '')) out.push(`font ${name}: checked date`);
  }
  const seen = new Set();
  for (const t of data.templates) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id ?? '')) say(t, 'id must be lower-case words joined by -');
    if (seen.has(t.id)) say(t, 'duplicate id');
    seen.add(t.id);
    const type = typeOf(t);
    if (!type) { say(t, `unknown type ${t.type}`); continue; }
    const ids = type.genres.map(([id]) => id);
    if (!Array.isArray(t.genres) || (ids.length ? !t.genres.length : t.genres.length)) say(t, 'genres must be set exactly when the type has genres');
    for (const g of t.genres ?? []) if (!ids.includes(g)) say(t, `unknown genre ${g} for ${t.type}`);
    for (const role of ['body', 'heading']) {
      const spec = t[role], f = data.fonts[spec?.family];
      if (!f) { say(t, `${role} font ${spec?.family} is not in fonts`); continue; }
      for (const w of spec.weights) if (!f.weights.includes(w)) say(t, `${role} ${spec.family} has no weight ${w}`);
      if (spec.italic && !f.italic) say(t, `${role} ${spec.family} has no italic`);
    }
    if (!t.body?.italic) say(t, 'body must include its italic (manuscripts use italics)');
    if (!CASES.includes(t.heading?.case)) say(t, `heading case ${t.heading?.case}`);
    if (!(t.size?.[0] > 0 && t.size[1] > t.size[0])) say(t, 'size must be [pt, leading] with leading > pt');
    if (!NUMBERS.includes(t.number)) say(t, `number ${t.number}`);
    if (!INITIALS.includes(t.initial)) say(t, `initial ${t.initial}`);
    if (typeof t.ornament !== 'string' || !t.ornament) say(t, 'ornament');
    if (!/^\d+(\.\d+)?x\d+(\.\d+)?$/.test(t.trim ?? '') || !isOffered(Ink.BW_WHITE, parseTrim(t.trim))) say(t, `trim ${t.trim} is not a KDP trim`);
    const m = t.margins ?? {};
    if (!(m.inside >= gutterIn(PAGES_ASSUMED))) say(t, `inside margin below KDP's ${gutterIn(PAGES_ASSUMED)} in for ${PAGES_ASSUMED} pages`);
    for (const k of ['top', 'bottom', 'outside']) if (!(m[k] >= outsideMarginMinIn(false))) say(t, `${k} margin below KDP's ${outsideMarginMinIn(false)} in`);
    if (typeof t.verse !== 'boolean') say(t, 'verse must be true or false');
    if (!samples[t.sample]) say(t, `sample ${t.sample} missing`);
    else if (!parse(samples[t.sample].text ?? '', { verse: t.verse }).some((b) => b.kind !== 'break')) say(t, `sample ${t.sample} has no text`);
    if (!t.why?.trim()) say(t, 'why is empty');
    const c = t.citation;
    if (c !== null && !(c?.book && c.author && c.publisher && c.year && c.typeface && c.note !== undefined
      && c.url?.startsWith('https://') && DATE.test(c.checked ?? ''))) say(t, 'citation must be null or complete');
  }
  return out;
}

/** Type/genre pairs no template covers, as 'novel/cozy' or 'memoir'. */
export function gaps(data) {
  const out = [];
  for (const type of TYPES) {
    const mine = data.templates.filter((t) => t.type === type.id);
    if (!type.genres.length) { if (!mine.length) out.push(type.id); continue; }
    for (const [g] of type.genres) if (!mine.some((t) => t.genres.includes(g))) out.push(`${type.id}/${g}`);
  }
  return out;
}
