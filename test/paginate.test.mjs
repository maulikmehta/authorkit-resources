import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_CHARS, inline, parse, size, splitBlock, paginate } from '../public/book-design-templates/paginate.js';

const plain = (b) => b.runs.map((r) => r.text).join('');

test('blank lines split paragraphs; single newlines inside a paragraph join with a space', () => {
  const b = parse('One line\nand more.\n\nSecond.');
  assert.deepEqual(b.map(plain), ['One line and more.', 'Second.']);
});

test('a paste with no blank lines (Word, Google Docs) makes every line a paragraph', () => {
  assert.deepEqual(parse('First para.\nSecond para.\nThird.').map(plain), ['First para.', 'Second para.', 'Third.']);
});

test('Windows line endings behave like \\n', () => {
  assert.deepEqual(parse('A\r\n\r\nB\r\nC').map(plain), ['A', 'B C']);
});

test('***, * * *, # and ~ alone on a line are scene breaks', () => {
  for (const mark of ['***', '* * *', '#', '~', '  ***  ']) {
    assert.deepEqual(parse(`A\n\n${mark}\n\nB`).map((b) => b.kind), ['p', 'break', 'p'], mark);
  }
  assert.deepEqual(parse('A\n***\nB').map((b) => b.kind), ['p', 'break', 'p']);
});

test('*word* and _word_ are italic', () => {
  assert.deepEqual(inline('a *big* and _quiet_ day'), [
    { text: 'a ', italic: false }, { text: 'big', italic: true },
    { text: ' and ', italic: false }, { text: 'quiet', italic: true }, { text: ' day', italic: false },
  ]);
});

test('unclosed marks, **double**, snake_case and lone asterisks stay literal', () => {
  for (const s of ['an *open mark', '**bold**', 'file_name_here', '5 * 3 = 15']) {
    assert.deepEqual(inline(s), [{ text: s, italic: false }], s);
  }
});

test('markup in the text stays literal text', () => {
  assert.equal(plain(parse('<script>alert(1)</script> & <b>x</b>')[0]), '<script>alert(1)</script> & <b>x</b>');
});

test('verse keeps line breaks; a blank line starts a stanza', () => {
  const b = parse('Season of mists\nand mellow\n\nClose bosom', { verse: true });
  assert.equal(b.length, 2);
  assert.deepEqual(b[0].lines.map((l) => l.map((r) => r.text).join('')), ['Season of mists', 'and mellow']);
});

test('input is capped at MAX_CHARS', () => {
  const b = parse('word '.repeat(50000));
  assert.ok(b.map(plain).join('').length <= MAX_CHARS);
});

test('splitBlock splits prose at a word, keeps italics, marks the tail as a continuation', () => {
  const [p] = parse('one *two three* four');
  assert.equal(size(p), 4);
  const [head, tail] = splitBlock(p, 2);
  // The space between words travels with the word after it.
  assert.deepEqual(head.runs, [{ text: 'one', italic: false }, { text: ' two', italic: true }]);
  assert.deepEqual(tail.runs, [{ text: 'three', italic: true }, { text: ' four', italic: false }]);
  assert.equal(tail.cont, true);
  assert.equal(head.cont, undefined);
});

test('a word glued to an italic run is not given a space', () => {
  const [p] = parse('the *Titanic*’s wake');
  // Tokens: 'the', 'Titanic', '’s', 'wake'.
  const [head] = splitBlock(p, 3);
  assert.equal(head.runs.map((r) => r.text).join(''), 'the Titanic’s');
});

// A fake page that holds `cap` units (words, lines, breaks).
const holds = (cap) => (i, bs) => bs.reduce((n, b) => n + size(b), 0) <= cap;

test('a paragraph longer than a page runs on across pages', () => {
  const blocks = parse(Array.from({ length: 25 }, (_, i) => `w${i}`).join(' '));
  const { pages, truncated } = paginate(blocks, holds(10));
  assert.deepEqual(pages.map((p) => size(p[0])), [10, 10, 5]);
  assert.equal(pages[1][0].cont, true);
  assert.equal(truncated, false);
});

test('a scene break that does not fit moves to the next page', () => {
  const blocks = parse('a b c\n\n***\n\nd');
  const { pages } = paginate(blocks, holds(3));
  assert.deepEqual(pages.map((p) => p.map((b) => b.kind)), [['p'], ['break', 'p']]);
});

test('more than maxPages is truncated', () => {
  const blocks = parse('w '.repeat(100));
  const { pages, truncated } = paginate(blocks, holds(10), 4);
  assert.equal(pages.length, 4);
  assert.equal(truncated, true);
});

test('always makes progress even if nothing fits', () => {
  const { pages, truncated } = paginate(parse('a\n\nb\n\nc'), () => false, 4);
  assert.equal(pages.length, 3);
  assert.equal(truncated, false);
});

test('empty text gives no pages', () => {
  assert.deepEqual(paginate(parse('  \n\n '), holds(10)), { pages: [], truncated: false });
});

test('a paragraph that cannot fit even one word on an empty page still flows on', () => {
  // Page 0 holds nothing (a long chapter title filled it); later pages hold 10 units.
  const fits = (i, bs) => bs.reduce((n, b) => n + size(b), 0) <= (i === 0 ? 0 : 10);
  const { pages } = paginate(parse(Array.from({ length: 15 }, (_, i) => `w${i}`).join(' ')), fits);
  assert.deepEqual(pages.map((p) => p.reduce((n, b) => n + size(b), 0)), [1, 10, 4]);
});
