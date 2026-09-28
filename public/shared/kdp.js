/**
 * KDP paperback rules for the AuthorKit resources: a port of
 * authorkit-studio/code/lib/core/src/kdp.rs, which is the source of truth
 * and cites KDP's help pages for every number.
 * test/kdp.test.mjs checks every function against the snapshot kdp.rs writes.
 * Never change a number here first.
 */

export const Ink = Object.freeze({
  BW_CREAM: 'bw-cream',
  BW_WHITE: 'bw-white',
  BW_GROUNDWOOD: 'bw-groundwood',
  STANDARD_COLOR: 'standard-color',
  PREMIUM_COLOR: 'premium-color',
});

export const INK_ALL = Object.freeze([
  Ink.BW_CREAM, Ink.BW_WHITE, Ink.BW_GROUNDWOOD, Ink.STANDARD_COLOR, Ink.PREMIUM_COLOR,
]);

/** KDP's own wording on the Paperback Content page (kdp.rs `kdp_label`). */
export const INK_LABELS = Object.freeze({
  [Ink.BW_CREAM]: 'Black & white interior with cream paper',
  [Ink.BW_WHITE]: 'Black & white interior with white paper',
  [Ink.BW_GROUNDWOOD]: 'Black & white interior with groundwood paper',
  [Ink.STANDARD_COLOR]: 'Standard color interior with white paper',
  [Ink.PREMIUM_COLOR]: 'Premium color interior with white paper',
});

const near = (a, b) => Math.abs(a - b) < 1e-6;
const r6 = (x) => Math.round(x * 1e6) / 1e6;

const ALL_TRIMS = Object.freeze([
  [5.0, 8.0], [5.06, 7.81], [5.25, 8.0], [5.5, 8.5],
  [6.0, 9.0], [6.14, 9.21], [6.69, 9.61], [7.0, 10.0],
  [7.44, 9.69], [7.5, 9.25], [8.0, 10.0], [8.25, 6.0],
  [8.25, 8.25], [8.5, 8.5], [8.5, 11.0], [8.27, 11.69],
]);

export function trimsFor(ink) {
  return ink === Ink.STANDARD_COLOR
    ? ALL_TRIMS.filter(([w, h]) => !(near(w, 8.27) && near(h, 11.69)))
    : ALL_TRIMS;
}

export const isOffered = (ink, [w, h]) => trimsFor(ink).some(([tw, th]) => near(tw, w) && near(th, h));
export const trimId = ([w, h]) => `${w}x${h}`;
export const parseTrim = (id) => id.split('x').map(Number);

export function pageLimits(ink, [w, h]) {
  const min = ink === Ink.STANDARD_COLOR ? 72 : 24;
  const is85 = near(w, 8.5) && (near(h, 8.5) || near(h, 11.0));
  const isA4 = near(w, 8.27) && near(h, 11.69);
  const is825 = near(w, 8.25) && (near(h, 6.0) || near(h, 8.25));
  const special =
    is85 ? { [Ink.BW_CREAM]: 550, [Ink.BW_GROUNDWOOD]: 578, [Ink.BW_WHITE]: 590, [Ink.PREMIUM_COLOR]: 590, [Ink.STANDARD_COLOR]: 600 }
    : isA4 ? { [Ink.BW_CREAM]: 730, [Ink.BW_GROUNDWOOD]: 764, [Ink.BW_WHITE]: 780, [Ink.PREMIUM_COLOR]: 590 }
    : is825 ? { [Ink.BW_CREAM]: 750, [Ink.BW_GROUNDWOOD]: 784, [Ink.BW_WHITE]: 800, [Ink.PREMIUM_COLOR]: 800, [Ink.STANDARD_COLOR]: 600 }
    : {};
  const standard = { [Ink.BW_GROUNDWOOD]: 812, [Ink.BW_CREAM]: 776, [Ink.BW_WHITE]: 828, [Ink.STANDARD_COLOR]: 600, [Ink.PREMIUM_COLOR]: 828 };
  return [min, special[ink] ?? standard[ink]];
}

export function gutterIn(pages) {
  if (pages <= 150) return 0.375;
  if (pages <= 300) return 0.5;
  if (pages <= 500) return 0.625;
  if (pages <= 700) return 0.75;
  return 0.875;
}

export const BLEED_IN = 0.125;
export const outsideMarginMinIn = (bleed) => (bleed ? 0.375 : 0.25);
export const pageSizeIn = ([w, h], bleed) => (bleed ? [w + BLEED_IN, h + 2 * BLEED_IN] : [w, h]);

const PER_PAGE = {
  [Ink.BW_WHITE]: 0.002252,
  [Ink.STANDARD_COLOR]: 0.002252,
  [Ink.BW_GROUNDWOOD]: 0.00235,
  [Ink.BW_CREAM]: 0.0025,
  [Ink.PREMIUM_COLOR]: 0.002347,
};

export function spineWidthIn(ink, pages) {
  const perPage = PER_PAGE[ink];
  if (perPage === undefined) throw new Error(`unknown ink ${ink}`);
  return r6(pages * perPage);
}

export const printedPages = (pages) => pages + (pages % 2);

export const SPINE_TEXT_MIN_PAGES = 80;
export const SPINE_TEXT_MARGIN_IN = 0.0625;
export const BARCODE_AREA_IN = Object.freeze([2.0, 1.2]);

export function coverSizeIn([w, h], ink, pages) {
  return [r6(2 * w + spineWidthIn(ink, pages) + 2 * BLEED_IN), r6(h + 2 * BLEED_IN)];
}

export const round2 = (x) => Math.round(x * 100) / 100;
export const isLargeTrim = ([w, h]) => w > 6.12 || h > 9.0;

export function paperbackPrintCost(market, ink, trim, pages) {
  if (market !== 'US') return null;
  const large = isLargeTrim(trim);
  let cost;
  if (ink === Ink.BW_CREAM || ink === Ink.BW_WHITE) {
    cost = pages <= 108 ? (large ? 2.84 : 2.30) : 1.00 + pages * (large ? 0.017 : 0.012);
  } else if (ink === Ink.BW_GROUNDWOOD) {
    cost = pages <= 112 ? (large ? 2.75 : 2.23) : 1.00 + pages * (large ? 0.0162 : 0.0114);
  } else if (ink === Ink.PREMIUM_COLOR) {
    cost = pages <= 40 ? (large ? 4.20 : 3.60) : 1.00 + pages * (large ? 0.08 : 0.065);
  } else if (ink === Ink.STANDARD_COLOR) {
    cost = 1.00 + pages * (large ? 0.0402 : 0.0255);
  } else {
    throw new Error(`unknown ink ${ink}`);
  }
  return round2(cost);
}

export function paperbackRoyaltyRate(market, list) {
  const step = { US: 9.99, UK: 7.99 }[market];
  if (step === undefined) return null;
  return list >= step ? 0.60 : 0.50;
}

export function paperbackRoyalty(market, list, printCost) {
  const rate = paperbackRoyaltyRate(market, list);
  return rate === null ? null : round2(rate * list - printCost);
}

export function paperbackListRange(market, printCost) {
  if (market !== 'US') return null;
  const step = 9.99;
  const atFifty = Math.ceil((printCost / 0.50) * 100) / 100;
  const min = atFifty < step ? atFifty : Math.ceil((printCost / 0.60) * 100) / 100;
  return [min, 250.0];
}
