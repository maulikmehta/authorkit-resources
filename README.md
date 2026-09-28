# authorkit-resources

Free resource tools for authors (calculators and guides), served at https://resources.authorkit.pro.
One folder per tool under `public/`; tools share only `public/shared/`.
Cloudflare Pages, Git-connected, production branch `main`, no build
command, output directory `public`.

## Commands

    npm test        # page rules, links, sitemap, KDP parity, each tool's logic

## Adding a tool

1. `public/<tool>/index.html` and `public/<tool>/<tool>.js` (pure logic).
2. `test/<tool>.test.mjs` for the logic.
3. A line on the hub (`public/index.html`) and a `<loc>` in `sitemap.xml`.
4. The page needs a canonical URL, a description, `data-verified` and a
   `<nav class="related">` linking to sibling resources and to good
   outside tools (KDP's own calculators, free generators) that serve the
   same author better on some point. `npm test` enforces these, and
   blocks code imports from another tool's folder. Links are welcome;
   shared code goes in `shared/`.

## KDP numbers

KDP numbers come from `authorkit-studio/code/lib/core/src/kdp.rs`, never
from here. `public/shared/kdp.js` is a port, checked against
`test/fixtures/kdp-cases.json`, which is written by kdp.rs's own test.

When KDP changes a number:

1. Change `kdp.rs` in authorkit-studio and run
   `UPDATE_KDP_CASES=1 cargo test --manifest-path code/Cargo.toml -p authorkit-core --test kdp_cases`.
2. Copy `code/lib/core/tests/snapshots/kdp-cases.json` to
   `test/fixtures/kdp-cases.json` here.
3. Run `npm test` and fix `public/shared/kdp.js` until it passes.

## Rules

- Free: no email gate, no account.
- Every number shows its source URL and the date it was checked.
- Push `main` only.
