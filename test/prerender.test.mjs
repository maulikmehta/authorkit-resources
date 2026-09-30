import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { render } from '../scripts/prerender.mjs';

const PUB = fileURLToPath(new URL('../public/', import.meta.url));

test('calculator pages carry their default results in static HTML (run npm run prerender)', () => {
  for (const [p, html] of Object.entries(render())) {
    assert.equal(readFileSync(PUB + p, 'utf8'), html, `${p} is stale`);
    // The checklist's margins wait for the author's page count; the calculators start filled.
    if (!p.startsWith('kdp-preflight')) assert.doesNotMatch(html, /class="ak-val" id="[\w-]+"><\/td>/, `${p} has an empty result cell`);
    else assert.match(html, /id="chk-page-count"/, 'checklist items missing');
  }
});
