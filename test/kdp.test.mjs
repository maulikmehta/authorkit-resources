import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as KDP from '../public/shared/kdp.js';

const cases = JSON.parse(readFileSync(new URL('./fixtures/kdp-cases.json', import.meta.url), 'utf8'));

// Deep compare with float tolerance; null must stay null.
function near(actual, expected, what) {
  if (expected === null) return assert.equal(actual, null, what);
  if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), `${what}: expected an array, got ${actual}`);
    assert.equal(actual.length, expected.length, what);
    return expected.forEach((e, i) => near(actual[i], e, what));
  }
  assert.ok(Math.abs(actual - expected) < 1e-9, `${what}: got ${actual}, kdp.rs says ${expected}`);
}

test('constants', () => {
  const c = cases.constants;
  near(KDP.BLEED_IN, c.bleed_in, 'BLEED_IN');
  near(KDP.SPINE_TEXT_MIN_PAGES, c.spine_text_min_pages, 'SPINE_TEXT_MIN_PAGES');
  near(KDP.SPINE_TEXT_MARGIN_IN, c.spine_text_margin_in, 'SPINE_TEXT_MARGIN_IN');
  near(KDP.BARCODE_AREA_IN, c.barcode_area_in, 'BARCODE_AREA_IN');
});

const table = {
  spine: (r) => near(KDP.spineWidthIn(r.ink, r.pages), r.in, `spine ${r.ink} ${r.pages}`),
  gutter: (r) => near(KDP.gutterIn(r.pages), r.in, `gutter ${r.pages}`),
  page_limits: (r) => near(KDP.pageLimits(r.ink, r.trim), [r.min, r.max], `limits ${r.ink} ${r.trim}`),
  page_size: (r) => near(KDP.pageSizeIn(r.trim, r.bleed), r.in, `page size ${r.trim} ${r.bleed}`),
  print_cost: (r) => near(KDP.paperbackPrintCost(r.market, r.ink, r.trim, r.pages), r.cost, `cost ${r.ink} ${r.trim} ${r.pages}`),
  royalty: (r) => near(KDP.paperbackRoyalty(r.market, r.list, r.print_cost), r.royalty, `royalty ${r.market} ${r.list}`),
  list_range: (r) => near(KDP.paperbackListRange(r.market, r.print_cost), r.range, `list range ${r.market} ${r.print_cost}`),
  printed_pages: (r) => near(KDP.printedPages(r.pages), r.printed, `printed ${r.pages}`),
  cover: (r) => near(KDP.coverSizeIn(r.trim, r.ink, r.pages), r.in, `cover ${r.ink} ${r.trim} ${r.pages}`),
};

for (const [key, check] of Object.entries(table)) {
  test(`${key} matches kdp.rs`, () => {
    assert.ok(cases[key]?.length, `fixture has no ${key} rows`);
    cases[key].forEach(check);
  });
}

test('every offered trim is offered and round-trips through its id', () => {
  for (const ink of KDP.INK_ALL) {
    for (const trim of KDP.trimsFor(ink)) {
      assert.ok(KDP.isOffered(ink, trim));
      assert.deepEqual(KDP.parseTrim(KDP.trimId(trim)), trim);
    }
  }
  assert.equal(KDP.isOffered(KDP.Ink.STANDARD_COLOR, [8.27, 11.69]), false);
});
