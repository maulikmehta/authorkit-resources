// Writes the book design template pages from templates.json and samples.json.
// The output is committed; Cloudflare serves it as is. After editing the data:
//   npm run build:templates
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPES, SITE_FONTS, PAGES_ASSUMED, typeOf, genreOf, answer, fontsHref, fmtTrim, inMm, problems } from '../public/book-design-templates/catalog.js';
import { parse, size, splitBlock } from '../public/book-design-templates/paginate.js';
import { gutterIn } from '../public/shared/kdp.js';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const DIR = join(PUB, 'book-design-templates');
const SITE = 'https://resources.authorkit.pro';
const BASE = '/book-design-templates/';
const KDP_MARGINS = 'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6';
const DISCLAIMER = '<p class="ak-disclaimer">These tools and guides are for information only. Check requirements with KDP, and ask a qualified professional about tax or legal questions. AuthorKit is not affiliated with Amazon.</p>';
const CASE = { upper: ['uppercase', 'normal', '.08em'], 'small-caps': ['none', 'all-small-caps', '.06em'], none: ['none', 'normal', '0'] };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// \u003c keeps </script> out; \u0027 keeps pages.test's `from '...'` import scanner off sample text.
const json = (o, indent) => JSON.stringify(o, null, indent).replace(/</g, '\\u003c').replace(/'/g, '\\u0027');
const runsHtml = (runs) => runs.map((r) => (r.italic ? `<em>${esc(r.text)}</em>` : esc(r.text))).join('');
const pairOf = (t) => (t.body.family === t.heading.family ? t.body.family : `${t.body.family} and ${t.heading.family}`);
const latest = (...dates) => dates.filter(Boolean).sort().at(-1);
const inches = (x) => `${x} in (${inMm(x)})`;
const fontVars = (t) => {
  const [tcase, caps, track] = CASE[t.heading.case];
  return `--bdt-body: '${t.body.family}', Georgia, serif; --bdt-head: '${t.heading.family}', Georgia, serif; --bdt-case: ${tcase}; --bdt-caps: ${caps}; --bdt-track: ${track}`;
};

// Masthead, footer, favicon and sidebar come from the reference page, so they never drift.
function chromeFrom(ref) {
  const grab = (re, what) => {
    const m = ref.match(re);
    if (!m) throw new Error(`cover-calculator/index.html has no ${what}`);
    return m[0];
  };
  const own = '<a href="/book-design-templates/">';
  const sidebar = grab(/<aside class="ak-sidebar">[\s\S]*?<\/aside>/, 'sidebar').replace(' aria-current="page"', '');
  if (!sidebar.includes(own)) throw new Error('add /book-design-templates/ to the sidebars first');
  return {
    icon: grab(/<link rel="icon" href="[^"]*">/, 'favicon'),
    masthead: grab(/<header class="masthead">[\s\S]*?<\/header>/, 'masthead'),
    footer: grab(/<footer class="colophon">[\s\S]*?<\/footer>/, 'footer'),
    sidebar: sidebar.replace(own, '<a href="/book-design-templates/" aria-current="page">'),
  };
}

function page({ chrome, title, description, path, fonts, ld, skip, crumbs, main, script }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${chrome.icon}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts.map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join('\n')}
<link rel="stylesheet" href="/shared/style.css">
<link rel="stylesheet" href="${BASE}templates.css">
<script type="application/ld+json">
${json(ld, 2)}
</script>
</head>
<body>
<a class="ak-skip" href="#main">${esc(skip)}</a>
${chrome.masthead}
<div class="wrap wrap--page">
<nav class="ak-crumbs" aria-label="Breadcrumb">
  <ol><li><a href="https://authorkit.pro">AuthorKit</a></li><li><a href="/">Resources</a></li>${crumbs}</ol>
</nav>
<div class="ak-page">
<main class="ak-main" id="main">
${main}
  ${DISCLAIMER}
</main>

${chrome.sidebar}
</div>
</div>
${chrome.footer}
${script}
</body>
</html>
`;
}

const crumbList = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(url && { item: url }) })),
});

function sources(items, checked) {
  return `  <section class="ak-sources">
    <p>Sources (last verified <span data-verified="${checked}">${checked}</span>):</p>
    <ul>
${items.map(([url, label, what]) => `      <li><a href="${esc(url)}">${esc(label)}</a>: ${esc(what)}</li>`).join('\n')}
    </ul>
  </section>`;
}

function fontRow(label, spec, f, isBody) {
  const styles = [...spec.weights.map(String), ...(isBody && spec.italic ? ['400 italic'] : [])].join(', ');
  return `        <tr><th scope="row">${label}</th><td><a href="${esc(f.specimen)}">${esc(spec.family)}</a><br><span class="ak-hint">Styles used: ${styles}. Licence: SIL Open Font License 1.1.</span></td></tr>`;
}

function inner(t, data, samples, chrome) {
  const s = samples[t.sample];
  const path = `${BASE}${t.id}/`;
  const type = typeOf(t);
  const fb = data.fonts[t.body.family], fh = data.fonts[t.heading.family];
  const pair = pairOf(t);
  const text = answer(t);
  const genre = genreOf(t)?.[1];
  const title = `${t.name}: ${pair} for a ${genreOf(t) ? `${genreOf(t)[2]} ` : ''}${type.noun}`;
  // Prev/next walk the whole catalog in book-type order, wrapping, so the author can flip
  // through pairings with their own text (it carries over via localStorage).
  const order = TYPES.flatMap((ty) => data.templates.filter((x) => x.type === ty.id));
  const at = order.indexOf(t);
  const prev = order[(at - 1 + order.length) % order.length], next = order[(at + 1) % order.length];
  const siblings = data.templates.filter((x) => x.id !== t.id && x.type === t.type);
  const more = (siblings.length ? siblings : data.templates.filter((x) => x.id !== t.id)).slice(0, 3);
  const m = t.margins;
  const vars = `${fontVars(t)}; --bdt-size: ${t.size[0]}pt; --bdt-lead: ${t.size[1]}pt; --bdt-top: ${m.top}in; --bdt-bottom: ${m.bottom}in`;
  const families = [...new Set([t.body.family, t.heading.family])];
  const c = t.citation;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': SITE + path, url: SITE + path, name: title, description: text,
        isPartOf: { '@type': 'WebSite', name: 'AuthorKit Resources', url: `${SITE}/` },
        mainEntity: {
          '@type': 'CreativeWork', name: t.name, description: text, genre: genre ?? type.label,
          about: families.map((f) => ({ '@type': 'CreativeWork', name: f, url: data.fonts[f].specimen, license: 'https://openfontlicense.org/' })),
          ...(c && { citation: {
            '@type': 'Book', name: c.book, author: { '@type': 'Person', name: c.author },
            publisher: { '@type': 'Organization', name: c.publisher }, datePublished: String(c.year),
            ...(c.isbn && { isbn: c.isbn }), url: c.url,
          } }),
        },
      },
      crumbList([['AuthorKit', 'https://authorkit.pro'], ['Resources', `${SITE}/`], ['Book design templates', SITE + BASE], [t.name]]),
    ],
  };
  const main = `  <header class="hero">
    <h1>${esc(t.name)}: ${esc(pair)}</h1>
    <p>${esc(text)}</p>
  </header>

  <section class="ak-tool" aria-label="Preview with your text">
    <div class="bdt-controls">
        <div class="ak-field bdt-wide"><label for="bdt-text">Your pages</label><textarea id="bdt-text" placeholder="Paste 1–2 pages of your manuscript"></textarea><span class="ak-hint">Paste from Word, or leave a blank line between paragraphs. *Asterisks* or _underscores_ make italics. A line of *** is a scene break. Your text stays in this browser and follows you to every template.</span></div>
        <div class="ak-field"><label for="bdt-title">Chapter title (optional)</label><input id="bdt-title" type="text"></div>
        <div class="ak-field"><label for="bdt-trim">Trim size</label><select id="bdt-trim"></select></div>
        <div class="ak-field"><button type="button" class="ak-btn" id="bdt-clear">Clear, use the sample</button></div>
    </div>
    <div class="bdt-preview bdt-initial-${t.initial}" style="${esc(vars)}">
        <div id="bdt-pages" class="bdt-pages" role="img" aria-label="${esc(`Book pages set in ${pair}`)}"></div>
        <div class="bdt-turn" id="bdt-turn" hidden><button type="button" class="bdt-btn ak-prev" id="bdt-back">Back</button><span id="bdt-at" aria-live="polite"></span><button type="button" class="bdt-btn ak-next" id="bdt-fwd">Next</button></div>
        <div id="bdt-measure" class="bdt-measure" aria-hidden="true"></div>
        <p class="ak-hint" id="bdt-note" aria-live="polite"></p>
        <p class="ak-hint" id="bdt-credit"></p>
    </div>
    <nav class="bdt-flip" aria-label="Other templates">
      <a href="${BASE}${prev.id}/" class="ak-prev" rel="prev">${esc(prev.name)}</a>
      <a href="${BASE}${next.id}/" class="ak-next" rel="next">${esc(next.name)}</a>
    </nav>
    <table class="ak-results">
      <tbody>
${fontRow('Body text', t.body, fb, true)}
${t.heading.family === t.body.family ? '' : fontRow('Chapter titles', t.heading, fh, false)}
        <tr><th scope="row">Body size / leading</th><td class="ak-val">${t.size[0]} / ${t.size[1]} pt</td></tr>
        <tr><th scope="row">Margins</th><td class="ak-val">top ${inches(m.top)}, bottom ${inches(m.bottom)}, inside ${inches(m.inside)}, outside ${inches(m.outside)}</td></tr>
      </tbody>
    </table>
  </section>
${c ? `
  <section class="ak-section ak-prose">
    <h2>Set in a published book</h2>
    <p><cite>${esc(c.book)}</cite> by ${esc(c.author)} (${esc(c.publisher)}, ${esc(c.year)}) is set in ${esc(c.typeface)}.${c.note ? ` ${esc(c.note)}` : ''} <a href="${esc(c.url)}">Source</a>.</p>
  </section>
` : ''}
  <section class="ak-section ak-prose">
    <h2>${siblings.length ? `More ${esc(type.label.toLowerCase())} templates` : 'More templates'}</h2>
    <ul>
${more.map((x) => `      <li><a href="${BASE}${x.id}/">${esc(x.name)}: ${esc(pairOf(x))}</a></li>`).join('\n')}
    </ul>
    <p><a href="${BASE}">All book design templates</a></p>
  </section>

  <details class="ak-faq">
    <summary><h2>About this preview</h2></summary>
    <div class="ak-faq-content ak-prose">
      <p>Your browser sets the preview, so line breaks and hyphens can fall a little differently from the PDF your formatting software makes. The fonts, sizes and margins are the ones in the table.</p>
      <p>The margins assume a book of about ${PAGES_ASSUMED} pages, for which KDP asks for an inside margin of at least ${inches(gutterIn(PAGES_ASSUMED))}. For your own page count, use the <a href="/cover-calculator/">KDP cover calculator</a>.</p>
      <p>${esc(data.ofl.note)}</p>
    </div>
  </details>

${sources([
    ...families.map((f) => [data.fonts[f].specimen, `Google Fonts: ${f}`, 'styles and licence']),
    [data.ofl.url, 'SIL Open Font License FAQ', 'using OFL fonts in books'],
    [s.source, `Project Gutenberg: ${s.title}`, 'sample text, public domain'],
    ...(c ? [[c.url, c.book, `set in ${c.typeface}`]] : []),
    [KDP_MARGINS, 'KDP: Trim, bleed and margins', 'trim sizes and minimum margins'],
  ], latest(fb.checked, fh.checked, s.checked, c?.checked, data.ofl.checked))}`;
  const script = `<script type="application/json" id="bdt-data">${json({ template: t, sample: s })}</script>
<script type="module" src="${BASE}preview.js"></script>`;
  return page({
    chrome, title: `${title} — AuthorKit`, description: text, path, ld, main, script,
    fonts: [fontsHref([...SITE_FONTS, t.body, t.heading])],
    skip: 'Skip to the preview',
    crumbs: `<li><a href="${BASE}">Book design templates</a></li><li aria-current="page">${esc(t.name)}</li>`,
  });
}

// The card's paragraph: the sample's first block, cut to about 45 words.
function excerpt(t, s) {
  const [b] = parse(s.text, { verse: t.verse });
  if (b.kind === 'verse') return b.lines.slice(0, 4);
  const cut = size(b) > 45 ? splitBlock(b, 45)[0] : b;
  return [[...cut.runs, ...(cut === b ? [] : [{ text: '…', italic: false }])]];
}

function gallery(data, samples, chrome) {
  const path = BASE;
  const cards = data.templates.map((t) => {
    const s = samples[t.sample];
    const lines = excerpt(t, s);
    const label = genreOf(t)?.[1] ?? typeOf(t).label;
    return {
      chars: s.heading + lines.flat().map((r) => r.text).join(''),
      html: `    <li class="bdt-card" data-type="${t.type}" data-genres="${t.genres.join(' ')}" style="${esc(fontVars(t))}"><a href="${BASE}${t.id}/" aria-label="${esc(`${t.name}: ${pairOf(t)}`)}">
      <span class="bdt-card__head">${esc(s.heading)}</span>
      <span class="bdt-card__body">${lines.map(runsHtml).join('<br>')}</span>
      <span class="bdt-card__meta"><strong>${esc(t.name)}</strong> · ${esc(pairOf(t))} · ${esc(label)}</span>
    </a></li>`,
    };
  });
  // Upper case too: some headings are set with text-transform: uppercase.
  const all = cards.map((c) => c.chars).join('');
  const chars = [...new Set(all + all.toUpperCase() + '0123456789')].sort().join('');
  const cardFonts = fontsHref(data.templates.flatMap((t) => [t.body, t.heading]), chars);
  const description = 'Free font pairings for book interiors, by book type and genre. Paste a page of your manuscript and see it set on a KDP trim, with where to get each font.';
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', '@id': SITE + path, url: SITE + path, name: 'Book design templates', description,
        isPartOf: { '@type': 'WebSite', name: 'AuthorKit Resources', url: `${SITE}/` },
        mainEntity: {
          '@type': 'ItemList', numberOfItems: data.templates.length,
          itemListElement: data.templates.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}${BASE}${t.id}/`, name: `${t.name}: ${pairOf(t)}` })),
        },
      },
      crumbList([['AuthorKit', 'https://authorkit.pro'], ['Resources', `${SITE}/`], ['Book design templates']]),
    ],
  };
  const chips = `  <nav class="bdt-filter" aria-label="Filter templates">
    <p class="bdt-chips" id="bdt-types"><a href="${BASE}" data-type="" aria-current="true">All</a>${TYPES.map((x) => `<a href="?type=${x.id}" data-type="${x.id}">${esc(x.label)}</a>`).join('')}</p>
${TYPES.filter((x) => x.genres.length).map((x) => `    <p class="bdt-chips" data-for="${x.id}" hidden><a href="?type=${x.id}" data-genre="">All</a>${x.genres.map(([id, label]) => `<a href="?type=${x.id}&amp;genre=${id}" data-genre="${id}">${esc(label)}</a>`).join('')}</p>`).join('\n')}
  </nav>`;
  const main = `  <header class="hero">
    <h1>Book design templates</h1>
    <p>Font pairings for book interiors, by book type and genre. Open one and paste a page of your manuscript to see it set.</p>
  </header>

${chips}
  <p class="ak-hint" id="bdt-count" aria-live="polite">${data.templates.length} templates</p>
  <ul class="bdt-grid">
${cards.map((c) => c.html).join('\n')}
  </ul>

  <details class="ak-faq">
    <summary><h2>How to use these templates</h2></summary>
    <div class="ak-faq-content ak-prose">
    <ol class="ak-steps">
      <li><strong>Pick your book type, then your genre.</strong> The cards show a chapter heading and a paragraph in each pairing.</li>
      <li><strong>Open a template and paste a page you know well.</strong> A page with dialogue and a page of description show the most. Your text follows you from template to template.</li>
      <li><strong>Set the trim you chose on KDP.</strong> The lines reflow to that page size.</li>
      <li><strong>Get the two fonts.</strong> Each template links to both on Google Fonts, and lists the sizes and margins to set in your formatting software.</li>
    </ol>
    <p>${esc(data.ofl.note)}</p>
    </div>
  </details>

${sources([
    [data.ofl.url, 'SIL Open Font License FAQ', 'using OFL fonts in books'],
    [KDP_MARGINS, 'KDP: Trim, bleed and margins', 'trim sizes and minimum margins'],
  ], data.ofl.checked)}`;
  const script = `<script type="module">
import { TYPES, matches } from '${BASE}catalog.js';

const cards = [...document.querySelectorAll('.bdt-card')];
const count = document.getElementById('bdt-count');
const mark = (a, on) => (on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));

function show() {
  const q = new URLSearchParams(location.search);
  const type = TYPES.find((x) => x.id === q.get('type'));
  const genre = type?.genres.find(([id]) => id === q.get('genre'))?.[0] ?? '';
  let n = 0;
  for (const c of cards) {
    c.hidden = !matches({ type: c.dataset.type, genres: c.dataset.genres.split(' ') }, type?.id ?? '', genre);
    n += !c.hidden;
  }
  count.textContent = \`\${n} template\${n === 1 ? '' : 's'}\`;
  for (const a of document.querySelectorAll('#bdt-types a')) mark(a, a.dataset.type === (type?.id ?? ''));
  for (const p of document.querySelectorAll('.bdt-chips[data-for]')) {
    p.hidden = p.dataset.for !== type?.id;
    for (const a of p.querySelectorAll('a')) mark(a, a.dataset.genre === genre);
  }
}

document.querySelector('.bdt-filter').addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  e.preventDefault();
  history.replaceState(null, '', a.href);
  show();
});
show();
</script>`;
  return page({
    chrome, title: 'Book design templates: font pairings for book interiors — AuthorKit', description, path, ld, main, script,
    fonts: [fontsHref(SITE_FONTS), cardFonts],
    skip: 'Skip to the templates',
    crumbs: '<li aria-current="page">Book design templates</li>',
  });
}

function sitemap(xml, templates) {
  const kept = xml.split('\n').filter((l) => !l.includes(`${SITE}${BASE}`));
  const ours = [BASE, ...templates.map((t) => `${BASE}${t.id}/`)].map((p) => `  <url><loc>${SITE}${p}</loc></url>`);
  const end = kept.findIndex((l) => l.includes('</urlset>'));
  return [...kept.slice(0, end), ...ours, ...kept.slice(end)].join('\n');
}

export function render() {
  const data = JSON.parse(readFileSync(join(DIR, 'templates.json'), 'utf8'));
  const samples = JSON.parse(readFileSync(join(DIR, 'samples.json'), 'utf8'));
  const bad = problems(data, samples);
  if (bad.length) throw new Error(`templates.json:\n${bad.join('\n')}`);
  const chrome = chromeFrom(readFileSync(join(PUB, 'cover-calculator/index.html'), 'utf8'));
  const files = { 'book-design-templates/index.html': gallery(data, samples, chrome) };
  for (const t of data.templates) files[`book-design-templates/${t.id}/index.html`] = inner(t, data, samples, chrome);
  files['sitemap.xml'] = sitemap(readFileSync(join(PUB, 'sitemap.xml'), 'utf8'), data.templates);
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = render();
  const keep = new Set(Object.keys(files).map((p) => p.split('/')[1]));
  for (const d of readdirSync(DIR, { withFileTypes: true })) {
    if (d.isDirectory() && !keep.has(d.name)) rmSync(join(DIR, d.name), { recursive: true });
  }
  for (const [p, content] of Object.entries(files)) {
    mkdirSync(dirname(join(PUB, p)), { recursive: true });
    writeFileSync(join(PUB, p), content);
  }
  console.log(`wrote ${Object.keys(files).length} files`);
}
