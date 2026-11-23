import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrivalRow, onRequest } from '../functions/_middleware.js';

const u = (q) => new URL(`https://resources.authorkit.pro/isbn-india/${q}`);

test('tagged arrival becomes a row; query before hash keeps the path clean', () => {
  assert.deepEqual(
    arrivalRow(u('?utm_source=YouTube&utm_campaign=kdp-vs-rrrna-isbn&utm_content=primary_tool#kdp-vs-rrrna'), 'Mozilla/5.0', 'IN'),
    { host: 'resources.authorkit.pro', source: 'youtube', campaign: 'kdp-vs-rrrna-isbn', content: 'primary_tool', path: '/isbn-india/', country: 'IN' }
  );
});

test('untagged, bot and malformed requests store nothing or nulls', () => {
  assert.equal(arrivalRow(u(''), 'Mozilla/5.0', 'IN'), null);
  assert.equal(arrivalRow(u('?utm_source=youtube'), 'Googlebot/2.1', 'IN'), null);
  assert.equal(arrivalRow(u('?utm_source=<script>'), 'Mozilla/5.0', 'IN'), null);
  const row = arrivalRow(u('?utm_source=youtube&utm_campaign=bad%20value'), '', 'india');
  assert.equal(row.campaign, null);
  assert.equal(row.country, null);
});

test('middleware passes the page through and writes only when DB is bound', async () => {
  const writes = [];
  const DB = { prepare: () => ({ bind: (...a) => ({ run: async () => writes.push(a) }) }) };
  const pending = [];
  const ctx = (env) => ({
    request: new Request(u('?utm_source=youtube').href, { headers: { 'user-agent': 'Mozilla/5.0' } }),
    env,
    next: async () => new Response('page'),
    waitUntil: (p) => pending.push(p),
  });
  assert.equal(await (await onRequest(ctx({ DB }))).text(), 'page');
  await Promise.all(pending);
  assert.equal(writes.length, 1);
  assert.equal(await (await onRequest(ctx({}))).text(), 'page');
});
