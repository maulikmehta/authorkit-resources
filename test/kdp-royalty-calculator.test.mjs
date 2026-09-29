import { test } from 'node:test';
import assert from 'node:assert/strict';
import { royaltyResult } from '../public/kdp-royalty-calculator/royalty.js';

const base = { ink: 'bw-white', trim: '6x9', pages: '300', list: '14.99', fx: '' };

test('6x9 white 300 pages at $14.99: print 4.60, 60%, royalty 4.39', () => {
  const r = royaltyResult(base);
  assert.equal(r.printCost, 4.6);
  assert.equal(r.rate, 0.6);
  assert.equal(r.royalty, 4.39);
});

test('India view: 15% withheld, net 3.73; expanded 1.40 before tax', () => {
  const r = royaltyResult(base);
  assert.equal(r.withholding, 0.66);
  assert.equal(r.net, 3.73);
  assert.equal(r.expanded.royalty, 1.4);
});

test('no exchange rate: rupee view is null, dollars still shown', () => {
  assert.equal(royaltyResult(base).inr, null);
});

test('exchange rate converts net to rupees', () => {
  const r = royaltyResult({ ...base, fx: '85' });
  assert.equal(r.inr.net, 317.05);
});

test('price below KDP minimum is an error naming the minimum', () => {
  const r = royaltyResult({ ...base, list: '8.99' });
  assert.match(r.error, /9\.20/);
});

test('page count outside KDP limits is an error naming the range', () => {
  assert.match(royaltyResult({ ...base, ink: 'bw-cream', pages: '20' }).error, /24.*776/);
});

test('odd page count is costed as the next even count', () => {
  assert.equal(royaltyResult({ ...base, pages: '301' }).pages, 302);
});

test('empty or junk input: error, never NaN', () => {
  for (const k of ['pages', 'list']) for (const v of ['', 'abc', '-3']) {
    const r = royaltyResult({ ...base, [k]: v });
    assert.ok(r.error, `${k}=${v}`);
    assert.doesNotMatch(JSON.stringify(r), /NaN|Infinity/);
  }
});

test('junk exchange rate is ignored, not NaN', () => {
  const r = royaltyResult({ ...base, fx: 'abc' });
  assert.equal(r.inr, null);
});

test('expanded distribution is null when it would lose money', () => {
  const r = royaltyResult({ ...base, list: '10.00' });
  assert.equal(r.expanded, null); // 0.4 × 10 − 4.60 < 0
});

test('garbage or empty trim is an error, not a silent fallback', () => {
  for (const v of ['', 'abc', '99x99']) {
    const r = royaltyResult({ ...base, trim: v });
    assert.ok(r.error, `trim=${v}`);
    assert.doesNotMatch(JSON.stringify(r), /NaN|Infinity/);
  }
});

test('list price at the exact 60% and 50% tier boundary', () => {
  const at999 = royaltyResult({ ...base, list: '9.99' });
  assert.equal(at999.rate, 0.6);
  assert.equal(at999.royalty, 1.39); // round2(0.6*9.99 - 4.60)
  const at998 = royaltyResult({ ...base, list: '9.98' });
  assert.equal(at998.rate, 0.5);
  assert.equal(at998.royalty, 0.39); // round2(0.5*9.98 - 4.60)
});
