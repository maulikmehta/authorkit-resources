import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

// ponytail: only checks when authorkit-studio is checked out next to this repo; CI would need both repos.
const studio = new URL('../../authorkit-studio/code/lib/core/tests/snapshots/kdp-cases.json', import.meta.url);
const local = new URL('./fixtures/kdp-cases.json', import.meta.url);

test('fixture matches the kdp.rs snapshot in authorkit-studio', { skip: !existsSync(studio) && 'authorkit-studio not next to this repo' }, () => {
  assert.equal(readFileSync(local, 'utf8'), readFileSync(studio, 'utf8'),
    'kdp.rs changed: copy its snapshot to test/fixtures/ and update public/shared/kdp.js');
});
