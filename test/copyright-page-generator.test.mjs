import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyrightPage, isIsbn13 } from '../public/copyright-page-generator/copyright.js';

const base = { author: 'Swati Joshi', year: '2026' };

test('minimum: notice line with ©, year, holder defaults to author', () => {
  const { lines } = copyrightPage(base);
  assert.equal(lines[0], 'Copyright © 2026 Swati Joshi');
});

test('holder overrides author in the notice', () => {
  assert.equal(copyrightPage({ ...base, holder: 'Pustak Press' }).lines[0], 'Copyright © 2026 Pustak Press');
});

test('each ISBN gets its own line with its format', () => {
  const { lines } = copyrightPage({ ...base, isbns: [
    { format: 'Paperback', isbn: '978-0-306-40615-7' },
    { format: 'Ebook', isbn: '9780306406157' },
  ] });
  assert.ok(lines.includes('ISBN 978-0-306-40615-7 (Paperback)'));
  assert.ok(lines.includes('ISBN 9780306406157 (Ebook)'));
});

test('empty ISBN rows and empty optional fields produce no lines', () => {
  const { lines } = copyrightPage({ ...base, isbns: [{ format: 'Paperback', isbn: '' }], publisher: ' ', edition: '' });
  assert.ok(lines.every((l) => l.trim() !== '' && !/ISBN|undefined|null/.test(l)));
});

test('optional lines only when ticked', () => {
  assert.ok(!copyrightPage(base).lines.some((l) => /All rights reserved/.test(l)));
  assert.ok(copyrightPage({ ...base, rightsReserved: true }).lines.some((l) => /All rights reserved/.test(l)));
});

test('missing author or a bad year is an error; title is not asked for', () => {
  assert.ok(!copyrightPage(base).error);
  assert.ok(copyrightPage({ ...base, author: '  ' }).error);
  for (const y of ['', '26', 'abcd', '3026']) assert.ok(copyrightPage({ ...base, year: y }).error, y);
});

test('an invalid ISBN is an error naming it', () => {
  const r = copyrightPage({ ...base, isbns: [{ format: 'Paperback', isbn: '978-0-306-40615-8' }] });
  assert.match(r.error, /978-0-306-40615-8/);
});

test('markup in names comes back as plain text (page uses textContent)', () => {
  const { lines } = copyrightPage({ ...base, author: '<img src=x onerror=alert(1)>' });
  assert.equal(lines[0], 'Copyright © 2026 <img src=x onerror=alert(1)>');
});

test('isIsbn13 checksum', () => {
  assert.equal(isIsbn13('978-0-306-40615-7'), true);
  assert.equal(isIsbn13('978 0 306 40615 7'), true);
  assert.equal(isIsbn13('978-0-306-40615-8'), false);
  assert.equal(isIsbn13('0306406152'), false); // ISBN-10 not accepted
});
