// Shared by the page scripts: the site's identity in schema.org terms, and
// the Open Graph block every page carries.
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
