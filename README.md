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
   sidebar `<nav class="related">` linking to sibling resources and to good
   outside tools (KDP's own calculators, free generators) that serve the
   same author better on some point. `npm test` enforces these, and
   blocks code imports from another tool's folder. Links are welcome;
   shared code goes in `shared/`.

### Page skeleton

Copy `public/cover-calculator/index.html` and keep its shape; every class
lives in `shared/style.css`:

- `header.masthead` (AuthorKit to authorkit.pro, Resources to `/`), then
  `div.wrap.wrap--page` holding `nav.ak-crumbs` (AuthorKit › Resources ›
  page) and `div.ak-page`.
- `div.ak-page` is a grid: `main.ak-main` then `aside.ak-sidebar`. Two
  columns (sidebar 16rem, sticky) above 60rem, one column below with the
  sidebar after main.
- In `main`: `header.hero` (h1 and one sentence), `section.ak-tool` (ruled
  box; `div.ak-tool__body` puts inputs beside the visual when there is room,
  then `table.ak-results`), then `section.ak-section.ak-prose` explainers,
  then `section.ak-sources` with `data-verified`. A standard disclaimer
  paragraph (`p.ak-disclaimer`) is the last child of main on every page; the
  test enforces the exact text. `.ak-draft` marks a page whose content is not
  final.
- The sidebar is `<nav class="related">` with two lists: "AuthorKit
  resources", linking every resource folder in the order of `RESOURCES` in
  `test/pages.test.mjs`, the current page with `aria-current="page"`; and
  "KDP's own tools". A new folder goes into `RESOURCES` and into the sidebar
  of every page; `npm test` fails until it is.
- `footer.colophon` last. Fonts: the Google Fonts link in the `<head>`.

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

    npm run build:templates   # after editing book-design-templates/templates.json or samples.json; commit the output
