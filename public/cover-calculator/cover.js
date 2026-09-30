import {
  parseTrim, pageLimits, printedPages, spineWidthIn,
  coverSizeIn, gutterIn, outsideMarginMinIn, SPINE_TEXT_MIN_PAGES, BARCODE_AREA_IN, BLEED_IN,
} from '../shared/kdp.js';


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

/** Barcode box inset from the spine fold and the bottom trim (KDP G5HDYGP4BXLX4RUW). */
const BARCODE_INSET_IN = 0.25;

/**
 * Proof diagram boxes for a successful coverResult, in inches, y down,
 * origin at the top-left bleed corner. The page scales the viewBox.
 */
export function proofGeometry({ trim: [tw, th], spine, wrap, barcode: [bw, bh] }) {
  const b = BLEED_IN;
  const back = { x: b, y: b, w: tw, h: th };
  const spineBox = { x: b + tw, y: b, w: spine, h: th };
  const front = { x: b + tw + spine, y: b, w: tw, h: th };
  return {
    viewBox: [...wrap],
    bleed: b,
    back,
    spine: spineBox,
    front,
    barcode: { x: spineBox.x - BARCODE_INSET_IN - bw, y: b + th - BARCODE_INSET_IN - bh, w: bw, h: bh },
    trimBox: { x: b, y: b, w: 2 * tw + spine, h: th },
  };
}
