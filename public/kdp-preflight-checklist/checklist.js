import { BLEED_IN, gutterIn, outsideMarginMinIn } from '../shared/kdp.js';

const SUB = 'https://kdp.amazon.com/en_US/help/topic/G201857950'; // Paperback submission guidelines
const BLEED = 'https://kdp.amazon.com/en_US/help/topic/GVBQ3CMEQW3W2VL6'; // Trim, bleed and margins
const FIX = 'https://kdp.amazon.com/en_US/help/topic/G201834260'; // Fix paperback formatting issues

/**
 * One item per preflight check we mirror, plus KDP-only extras (check: null).
 * `quote` is KDP's own wording, fetched 2026-09-29 from `source`; numbers appear only there.
 * @type {{ id: string, check: string | null, title: string, detail: string, quote: string, source: string, sourceTitle: string }[]}
 */
export const ITEMS = [
  {
    id: 'page-count', check: 'page-count',
    title: 'Page count is within KDP’s limits',
    detail: 'Your PDF has at least the minimum and no more than the maximum pages for your paper, ink and trim.',
    quote: 'The minimum page count is 24 pages, and the maximum page count depends on ink, paper, and trim size options.',
    source: `${SUB}#pagcount`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'page-size', check: 'page-size',
    title: 'Page size matches your trim size',
    detail: 'Every page is exactly your trim size, or your trim size plus bleed if your book has bleed.',
    quote: 'Set the page size to your selected trim size (width by height).',
    source: `${SUB}#pagesize`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'safe-area', check: 'safe-area',
    title: 'Text stays inside the margins',
    detail: 'Nothing you need to keep sits closer to the outside edges, or to the spine, than the margins for your page count (shown above once you enter it).',
    quote: 'The top, bottom, and outside margins must be a minimum of 0.25 inches for books without bleed and 0.375 inches (9.6mm) for books with bleed. The inside margin size depends on the page count',
    source: `${BLEED}#margins`, sourceTitle: 'Trim, bleed and margins',
  },
  {
    id: 'missing-image', check: 'missing-image',
    title: 'Images are embedded in the file',
    detail: 'Every image is embedded in your file, not linked. Page through the PDF and check each picture appears.',
    quote: 'Embed all fonts and images in your native file prior to submission.',
    source: `${SUB}#filespec`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'fonts-embedded', check: 'fonts-embedded',
    title: 'Fonts are embedded',
    detail: 'In your PDF viewer’s document properties, every font is listed as embedded.',
    quote: 'All fonts in the interior files should be embedded in the native program before publishing.',
    source: `${SUB}#font`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'low-resolution', check: 'low-resolution',
    title: 'Images are high enough resolution',
    detail: 'Each image, at the size it is printed, has enough pixels to print sharp.',
    quote: 'Minimum resolution of 300 DPI.',
    source: `${SUB}#imgres`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'bleed-unused', check: 'bleed-unused',
    title: 'Bleed if art reaches the page edge',
    detail: 'If any image, background or illustration should reach the edge of a page, the whole file is sized for bleed.',
    quote: 'You should include bleed in your interior file if you have any images, backgrounds, or illustrations in your book that you want to reach the edge of the page.',
    source: `${BLEED}#bleedhowto`, sourceTitle: 'Trim, bleed and margins',
  },
  {
    id: 'blank-pages', check: 'blank-pages',
    title: 'No long runs of blank pages',
    detail: 'Count blank pages in a row. The limit is lower at the start and middle of the book than at the end.',
    quote: 'we allow no more than 4 consecutive blank pages at the beginning or middle of a manuscript file, and/or 10 consecutive blank pages at the end.',
    source: `${FIX}#blank`, sourceTitle: 'Fix paperback and hardcover formatting issues',
  },
  {
    id: 'art-needs-bleed', check: 'art-needs-bleed',
    title: 'Art that reaches the edge has bleed',
    detail: 'Images and backgrounds meant to touch the edge run past the trim line on the top, bottom and outside edges.',
    quote: 'extend them 0.125" (3.2 mm) beyond the final trim size from the top, bottom, and outer edges of your manuscript.',
    source: `${SUB}#bleed`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'no-crop-marks', check: null,
    title: 'No crop marks or trim marks',
    detail: 'The PDF has no printer’s marks, and no bookmarks, comments or placeholder text.',
    quote: 'Submitted files should not contain crop marks, trim marks, bookmarks, comments, invisible objects, annotations, placeholder text, or metadata.',
    source: `${SUB}#filespec`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'single-page-pdf', check: null,
    title: 'Single pages, not spreads',
    detail: 'Each PDF page is one book page, not two facing pages side by side.',
    quote: 'We require single page files (as opposed to spreads or 2-up files).',
    source: `${SUB}#pagespread`, sourceTitle: 'Paperback submission guidelines',
  },
  {
    id: 'file-size', check: null,
    title: 'File is under the size limit',
    detail: 'Check the PDF’s size on disk against KDP’s limit.',
    quote: 'Ensure file size is not more than 650MB.',
    source: `${SUB}#filespec`, sourceTitle: 'Paperback submission guidelines',
  },
];

/**
 * Preflight checks left off the page because no KDP page was found that says it.
 * The mirror test counts them, so a new Check still fails the test.
 */
export const UNSOURCED = ['colour-in-bw'];

const fmt = (inches) => `${inches.toFixed(3)}″ (${(inches * 25.4).toFixed(1)} mm)`;

/** gutter/margins text for a page count, from shared/kdp.js, inches and mm. */
export function marginsFor(pages) {
  const s = String(pages ?? '').trim();
  if (!/^\d+$/.test(s) || Number(s) < 1) return { error: 'Enter your page count to see the margins for it.' };
  return {
    gutter: fmt(gutterIn(Number(s))),
    outside: fmt(outsideMarginMinIn(false)),
    outsideBleed: fmt(outsideMarginMinIn(true)),
    bleed: fmt(BLEED_IN),
  };
}

/** @param {Set<string>} done  ids ticked @returns {{ done: number, total: number }} */
export function progress(done) {
  return { done: ITEMS.filter((i) => done.has(i.id)).length, total: ITEMS.length };
}
