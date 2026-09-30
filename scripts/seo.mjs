// Head metadata for the hand-written pages, and the sitemap for every page.
// Adds, between <!-- seo --> markers before </head>: Open Graph tags and a
// JSON-LD block (WebApplication for tools, Article for guides, Organization
// and WebSite on the hub, BreadcrumbList from the visible crumbs). Marks the
// "last verified" date up as <time>. Writes sitemap.xml with lastmod from
// each page's verified date. Template pages carry their own (their generator).
// Run after any page edit: npm run seo (test/seo.test.mjs checks it).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, ORG_ID, WEBSITE_ID, ogTags, breadcrumbs, ldJson, cspMeta } from './head.mjs';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));
const KIND = {
  'index.html': 'hub',
  'cover-calculator': 'tool', 'kdp-royalty-calculator': 'tool', 'copyright-page-generator': 'tool',
  'kdp-preflight-checklist': 'tool', 'book-description-formatter': 'tool',
  'novel-word-count': 'guide', 'kdp-from-india': 'guide', 'isbn-india': 'guide', 'book-mockups': 'guide',
};
const GENERATED = 'book-design-templates';

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const pages = () => walk(PUB).filter((p) => p.endsWith('index.html')).map((p) => relative(PUB, p).split(sep).join('/'))
  .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
const urlOf = (rel) => `${SITE}/${rel.replace(/index\.html$/, '')}`;
const first = (html, re) => (html.match(re) ?? [])[1];
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const text = (s) => unesc(s.replace(/<[^>]+>/g, '')).trim();

function crumbs(html) {
  const ol = first(html, /<nav class="ak-crumbs"[^>]*>\s*<ol>([\s\S]*?)<\/ol>/);
  if (!ol) return null;
  return [...ol.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(([, li]) => {
    const href = first(li, /href="([^"]+)"/);
    const url = !href ? undefined : href.startsWith('/') ? SITE + href : href.replace(/^(https:\/\/[^/]+)$/, '$1/');
    return [text(li), url];
  });
}

function graph(rel, html) {
  const kind = KIND[rel.split('/')[0]];
  const url = urlOf(rel);
  const title = text(first(html, /<title>([^<]+)<\/title>/)).replace(/ — AuthorKit$/, '');
  const description = unesc(first(html, /<meta name="description" content="([^"]*)"/));
  const verified = first(html, /data-verified="(\d{4}-\d{2}-\d{2})"/);
  const h1 = text(first(html, /<h1>([\s\S]*?)<\/h1>/));
  const nodes = [];
  if (kind === 'hub') {
    nodes.push(
      { '@type': 'Organization', '@id': ORG_ID, name: 'AuthorKit', url: 'https://authorkit.pro/',
        founder: { '@type': 'Person', name: 'Swati Joshi', url: 'https://swatisjournal.com/' } },
      { '@type': 'WebSite', '@id': WEBSITE_ID, name: 'AuthorKit Resources', url: `${SITE}/`, description, publisher: { '@id': ORG_ID } },
    );
  } else if (kind === 'tool') {
    nodes.push({
      '@type': 'WebApplication', '@id': `${url}#app`, name: h1, url, description,
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      ...(verified && { dateModified: verified }), isPartOf: { '@id': WEBSITE_ID }, publisher: { '@id': ORG_ID },
    });
  } else {
    nodes.push({
      '@type': 'Article', '@id': `${url}#article`, headline: h1.slice(0, 110), name: title, description, url,
      mainEntityOfPage: url, ...(verified && { dateModified: verified }),
      author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, isPartOf: { '@id': WEBSITE_ID },
    });
  }
  const c = crumbs(html);
  if (c) nodes.push(breadcrumbs(c));
  return { kind, url, title, description, nodes };
}

function head(rel, html) {
  const g = graph(rel, html);
  const block = `<!-- seo -->\n${cspMeta(html)}\n${ogTags({ title: g.title, description: g.description, url: g.url, type: g.kind === 'guide' ? 'article' : 'website' })}\n`
    + `<script type="application/ld+json">\n${ldJson({ '@context': 'https://schema.org', '@graph': g.nodes })}\n</script>\n<!-- /seo -->`;
  const stripped = html.replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->\n?/, '');
  return stripped.replace('</head>', `${block}\n</head>`)
    .replace(/<span data-verified="(\d{4}-\d{2}-\d{2})">\1<\/span>/g, '<time data-verified="$1" datetime="$1">$1</time>');
}

function sitemap(all) {
  const dates = all.map((rel) => first(readFileSync(PUB + rel, 'utf8'), /data-verified="(\d{4}-\d{2}-\d{2})"/));
  const newest = dates.filter(Boolean).sort().at(-1);
  const rows = all.map((rel, i) => `  <url><loc>${urlOf(rel)}</loc><lastmod>${dates[i] ?? newest}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

// llms.txt (llmstxt.org): the hub's own list of resources, as plain Markdown.
function llms() {
  const hub = readFileSync(PUB + 'index.html', 'utf8');
  const lead = text(first(hub, /<header class="hero">[\s\S]*?<p>([\s\S]*?)<\/p>/));
  const list = first(hub, /<ul class="ak-index" id="tools">([\s\S]*?)<\/ul>/);
  const items = [...list.matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><span>([\s\S]*?)<\/span><\/li>/g)]
    .map(([, href, name, what]) => `- [${text(name)}](${SITE}${href}): ${text(what)}`);
  return `# AuthorKit Resources\n\n> ${lead}\n\n## Resources\n\n${items.join('\n')}\n`;
}

export function render() {
  const all = pages();
  const files = {};
  for (const rel of all) {
    if (rel.startsWith(`${GENERATED}/`)) continue;
    if (!KIND[rel.split('/')[0]]) throw new Error(`${rel}: add it to KIND in scripts/seo.mjs`);
    files[rel] = head(rel, readFileSync(PUB + rel, 'utf8'));
  }
  files['sitemap.xml'] = sitemap(all);
  files['llms.txt'] = llms();
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [rel, content] of Object.entries(render())) writeFileSync(PUB + rel, content);
  console.log('seo: head blocks and sitemap written');
}
