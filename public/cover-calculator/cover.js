import {
  trimsFor, isOffered, trimId, parseTrim, pageLimits, printedPages, spineWidthIn,
  coverSizeIn, gutterIn, outsideMarginMinIn, SPINE_TEXT_MIN_PAGES, BARCODE_AREA_IN,
} from '../shared/kdp.js';

/** Keep the chosen trim if this ink offers it, else the ink's first trim. */
export function pickTrim(ink, currentId) {
  return currentId && isOffered(ink, parseTrim(currentId)) ? currentId : trimId(trimsFor(ink)[0]);
}

export const fmt = (inches) => `${inches.toFixed(3)}″ (${(inches * 25.4).toFixed(1)} mm)`;

export function coverResult(ink, id, pagesInput) {
  const trim = parseTrim(id);
  const [min, max] = pageLimits(ink, trim);
  const typed = Number.parseInt(String(pagesInput).trim(), 10);
  if (!Number.isFinite(typed)) return { error: `Enter a page count between ${min} and ${max}.`, min, max };
  const pages = printedPages(typed);
  if (pages < min || pages > max) {
    return { error: `KDP prints this paper and trim at ${min} to ${max} pages.`, min, max };
  }
  return {
    pages,
    rounded: pages !== typed,
    spine: spineWidthIn(ink, pages),
    wrap: coverSizeIn(trim, ink, pages),
    trim,
    spineText: pages >= SPINE_TEXT_MIN_PAGES,
    gutter: gutterIn(pages),
    outside: [outsideMarginMinIn(false), outsideMarginMinIn(true)],
    barcode: [...BARCODE_AREA_IN],
    min,
    max,
  };
}
