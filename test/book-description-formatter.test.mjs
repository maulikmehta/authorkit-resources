import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDescription, ALLOWED, MAX_CHARS } from '../public/book-description-formatter/describe.js';

const tags = (html) => [...html.matchAll(/<\/?([a-z0-9]+)/g)].map((m) => m[1]);

test('blank line splits paragraphs; single newline is a line break', () => {
  assert.equal(formatDescription('One\ntwo\n\nThree').html, '<p>One<br>two</p><p>Three</p>');
});

test('bold and italic marks', () => {
  assert.equal(formatDescription('A **big** *quiet* book').html, '<p>A <b>big</b> <i>quiet</i> book</p>');
});

test('dash lines become a list', () => {
  assert.equal(formatDescription('- one\n- two').html, '<ul><li>one</li><li>two</li></ul>');
});

test('author-typed HTML is escaped, never passed through', () => {
  const { html } = formatDescription('<script>alert(1)</script> & "quotes"');
  assert.equal(html, '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;</p>');
});

test('output only ever uses allowed tags', () => {
  const { html } = formatDescription('**a** *b*\n\n- c\n- d\n\ne\nf');
  for (const t of tags(html)) assert.ok(ALLOWED.includes(t), t);
});

test('unclosed marks stay literal', () => {
  assert.equal(formatDescription('2 * 3 and **not closed').html, '<p>2 * 3 and **not closed</p>');
});

test('empty input: empty html, zero chars, not over', () => {
  assert.deepEqual(formatDescription('   \n\n '), { html: '', chars: 0, over: false });
});

test('over the limit is flagged', () => {
  assert.equal(formatDescription('x'.repeat(MAX_CHARS + 1)).over, true);
});

test('Windows line endings behave like \\n', () => {
  assert.equal(formatDescription('One\r\n\r\nTwo').html, formatDescription('One\n\nTwo').html);
});

// Every open tag is closed in reverse order (br is void).
const wellFormed = (html) => {
  const stack = [];
  for (const [, close, name] of html.matchAll(/<(\/?)([a-z0-9]+)>/g)) {
    if (name === 'br') continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
};

test('triple asterisk nests bold around italic', () => {
  assert.equal(formatDescription('***both***').html, '<p><b><i>both</i></b></p>');
});

test('mixed marks always produce well-nested tags', () => {
  for (const s of ['***a*** and **b** and *c*', '**a *b* c**', '*a **b** c*', '**a *b** c*', '*a **b* c**', '***a**', '- **x** *y*\n- ***z***']) {
    assert.ok(wellFormed(formatDescription(s).html), s);
  }
});

test('chars counts the markup, like KDP does', () => {
  assert.equal(formatDescription('test').chars, '<p>test</p>'.length);
  assert.equal(formatDescription('**test**').chars, '<p><b>test</b></p>'.length);
});
