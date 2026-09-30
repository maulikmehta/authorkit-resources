// Shared by the page scripts: the site's identity in schema.org terms, the
// Open Graph block and the Content-Security-Policy every page carries.
import { createHash } from 'node:crypto';
export const SITE = 'https://resources.authorkit.pro';
export const ORG_ID = `${SITE}/#org`;
export const WEBSITE_ID = `${SITE}/#website`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bare = (title) => title.replace(/ — AuthorKit$/, '');

/** Open Graph and Twitter card tags, from the page's own title, description and canonical URL. */
export function ogTags({ title, description, url, type = 'website' }) {
  return [
    `<meta property="og:type" content="${type}">`,
    '<meta property="og:site_name" content="AuthorKit Resources">',
    `<meta property="og:title" content="${esc(bare(title))}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    '<meta name="twitter:card" content="summary">',
  ].join('\n');
}

/** BreadcrumbList from [name, url?] pairs; the last (current) crumb has no url. */
export const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(url && { item: url }) })),
});

/** JSON for a <script> block: < keeps a </script> in the data from closing the tag. */
export const ldJson = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

/**
 * Content-Security-Policy as a <meta>, allowing this page's inline module
 * scripts by hash and nothing inline besides. (frame-ancestors can't be set
 * in a meta tag; _headers sends it.) JSON-LD and JSON data blocks don't run,
 * so they need no hash.
 */
export function cspMeta(html) {
  const hashes = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)]
    .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  const policy = [
    "default-src 'self'",
    // Cloudflare injects its Web Analytics beacon at the edge (cookie-less; enabled in Pages).
    `script-src 'self' https://static.cloudflareinsights.com${hashes.map((h) => ` ${h}`).join('')}`,
    "connect-src 'self' https://cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
}
