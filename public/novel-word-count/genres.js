/**
 * Word-count ranges, each from ONE source fetched and re-checked on
 * `checked`. Primary sources (SFWA, a publisher's/imprint's own submission
 * guidelines) come first. For genres with no primary source, a row may cite
 * one named, dated industry page that states that genre's range itself
 * (owner decision 2026-09-29) — Writer's Digest, Jericho Writers, Reedsy's
 * editorial guides, or a writers' organisation such as SCBWI for children's
 * books. Never averaged or combined across sources. See the page's "Why
 * some genres aren't listed" section for what was searched for and dropped.
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
  { id: 'reedsy-fantasy-scifi', label: 'Fantasy & science fiction (Reedsy)', min: 100000, max: 115000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'jericho-historical', label: 'Historical fiction (Jericho Writers)', min: 75000, max: 100000, source: 'https://jerichowriters.com/average-novel-wordcount/', checked: '2026-09-29' },
  { id: 'harlequin-historical', label: 'Historical romance (Harlequin Historical)', min: 70000, max: 75000, source: 'https://harlequin.submittable.com/submit', checked: '2026-09-29' },
  { id: 'reedsy-horror', label: 'Horror (Reedsy)', min: 70000, max: 100000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'harlequin-love-inspired-trade', label: 'Inspirational romance, trade (Love Inspired Trade)', min: 85000, max: 100000, source: 'https://harlequin.submittable.com/submit', checked: '2026-09-29' },
  { id: 'reedsy-literary', label: 'Literary fiction (Reedsy)', min: 80000, max: 100000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'reedsy-memoir', label: 'Memoir (Reedsy)', min: 80000, max: 90000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'reedsy-mystery-thriller', label: 'Mystery & thriller (Reedsy)', min: 80000, max: 100000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'reedsy-romance', label: 'Single-title romance (Reedsy)', min: 80000, max: 100000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'jericho-womens', label: "Upmarket & women's fiction (Jericho Writers)", min: 75000, max: 110000, source: 'https://jerichowriters.com/average-novel-wordcount/', checked: '2026-09-29' },
  { id: 'reedsy-ya', label: 'Young adult (Reedsy)', min: 55000, max: 80000, source: 'https://reedsy.com/studio/resources/how-many-words-in-a-novel/', checked: '2026-09-29' },
  { id: 'scbwi-middle-grade', label: 'Middle grade (SCBWI)', min: 25000, max: 62500, source: 'https://scbwikitetales.com/2016/10/12/ask-an-editor-word-count-for-middle-grade-and-young-adult/', checked: '2026-09-29' },
  { id: 'scbwi-picture-books', label: 'Picture books (SCBWI)', min: 500, max: 750, source: 'https://scbwikitetales.com/2022/01/19/ask-an-editor-word-count/', checked: '2026-09-29' },
];

/**
 * Words per printed page by trim id. Left empty: a search today (checked
 * 2026-09-29) found no named typesetting or publishing source that states a
 * words-per-page figure for a given trim and font — only blog posts and
 * "rule of thumb" pages that don't cite one. See the report for what was
 * tried. No estimator is built on this page.
 */
export const WORDS_PER_PAGE = {};
