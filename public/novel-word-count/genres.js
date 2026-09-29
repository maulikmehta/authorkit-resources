/**
 * Word-count ranges, each from a source fetched and re-checked on `checked`.
 * These are length categories and publisher/imprint lines with a real,
 * fetchable primary source — not a full genre-by-genre map. See the page's
 * "Why some genres aren't listed" section for what was searched for and
 * dropped.
 *
 * `max: null` means the source states no upper bound (SFWA's "Novel" is
 * "40,000 words or more").
 */
export const GENRES = [
  { id: 'sfwa-short-story', label: 'Short story (SFWA)', min: 1, max: 7499, source: 'https://www.sfwa.org/complete-nebula-awards-rules/', checked: '2026-09-29' },
  { id: 'sfwa-novelette', label: 'Novelette (SFWA)', min: 7500, max: 17499, source: 'https://www.sfwa.org/complete-nebula-awards-rules/', checked: '2026-09-29' },
  { id: 'sfwa-novella', label: 'Novella (SFWA)', min: 17500, max: 39999, source: 'https://www.sfwa.org/complete-nebula-awards-rules/', checked: '2026-09-29' },
  { id: 'sfwa-novel', label: 'Novel (SFWA)', min: 40000, max: null, source: 'https://www.sfwa.org/complete-nebula-awards-rules/', checked: '2026-09-29' },
  { id: 'baen-sff', label: 'Adult science fiction & fantasy (Baen Books)', min: 100000, max: 130000, source: 'https://www.baen.com/submit', checked: '2026-09-29' },
  { id: 'harlequin-historical', label: 'Historical romance (Harlequin Historical)', min: 70000, max: 75000, source: 'https://harlequin.submittable.com/submit', checked: '2026-09-29' },
  { id: 'harlequin-love-inspired-trade', label: 'Inspirational romance, trade (Love Inspired Trade)', min: 85000, max: 100000, source: 'https://harlequin.submittable.com/submit', checked: '2026-09-29' },
];

/**
 * Words per printed page by trim id. Left empty: a search today (checked
 * 2026-09-29) found no named typesetting or publishing source that states a
 * words-per-page figure for a given trim and font — only blog posts and
 * "rule of thumb" pages that don't cite one. See the report for what was
 * tried. No estimator is built on this page.
 */
export const WORDS_PER_PAGE = {};
