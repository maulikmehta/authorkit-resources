import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverResult, pickTrim, fmt } from '../public/cover-calculator/cover.js';

test('6x9 white 300 pages: full wrap, spine, interior margins', () => {
  const r = coverResult('bw-white', '6x9', '300');
  assert.equal(r.error, undefined);
  assert.deepEqual(r.wrap, [12.9256, 9.25]);
  assert.equal(r.spine, 0.6756);
  assert.equal(r.gutter, 0.5);
  assert.equal(r.spineText, true);
});

test('odd page count is printed as the next even count', () => {
  const r = coverResult('bw-white', '6x9', '301');
  assert.equal(r.pages, 302);
  assert.equal(r.rounded, true);
});

test('79 pages rounds to 80: spine text allowed; 78 is not', () => {
  assert.equal(coverResult('bw-white', '6x9', '79').spineText, true);
  assert.equal(coverResult('bw-white', '6x9', '78').spineText, false);
});

test('page count outside KDP limits gives the range, not dimensions', () => {
  const low = coverResult('bw-cream', '6x9', '20');
  assert.match(low.error, /24.*776/);
  assert.equal(low.wrap, undefined);
  const high = coverResult('bw-cream', '6x9', '900');
  assert.match(high.error, /24.*776/);
});

test('empty or non-numeric input asks for a page count, never NaN', () => {
  for (const input of ['', 'abc', '  ']) {
    const r = coverResult('bw-white', '6x9', input);
    assert.match(r.error, /Enter a page count/);
    assert.doesNotMatch(JSON.stringify(r), /NaN/);
  }
});

test('switching to standard colour drops the A4 trim it does not offer', () => {
  assert.equal(pickTrim('bw-white', '8.27x11.69'), '8.27x11.69');
  assert.equal(pickTrim('standard-color', '8.27x11.69'), '5x8');
  assert.equal(pickTrim('standard-color', '6x9'), '6x9');
});

test('fmt shows inches and millimetres', () => {
  assert.equal(fmt(12.9256), '12.926″ (328.3 mm)');
});
