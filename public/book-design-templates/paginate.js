// Manuscript text → blocks → pages. Pure: no DOM. The page script supplies
// `fits`, which measures a candidate page in the browser.

/** More than 4 pages ever need; stops a pasted whole manuscript stalling the page. */
export const MAX_CHARS = 20000;

const BREAK = /^\s*(\*\s*\*\s*\*|#|~)\s*$/;
// *x* or _x_: not inside a word, not doubled, no space just inside the marks.
const MARK = /(?<![\p{L}\p{N}*_])([*_])(?![\s*_])(.+?)(?<![\s*_])\1(?![\p{L}\p{N}*_])/gu;

/** @typedef {{ text: string, italic: boolean }} Run */
/** @typedef {{ kind: 'p', runs: Run[], cont?: true } | { kind: 'verse', lines: Run[][], cont?: true } | { kind: 'break' }} Block */

/** @returns {Run[]} */
export function inline(s) {
  const runs = [];
  let last = 0;
  for (const m of s.matchAll(MARK)) {
    if (m.index > last) runs.push({ text: s.slice(last, m.index), italic: false });
    runs.push({ text: m[2], italic: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) runs.push({ text: s.slice(last), italic: false });
  return runs;
}

/** @returns {Block[]} */
export function parse(text, { verse = false } = {}) {
  const src = String(text ?? '').replace(/\r\n?/g, '\n').slice(0, MAX_CHARS);
  // Word and Google Docs put one newline between paragraphs; typed text uses blank lines.
  const chunks = verse || /\n[ \t]*\n/.test(src) ? src.split(/\n[ \t]*\n/) : src.split('\n');
  const blocks = [];
  for (const chunk of chunks) {
    let lines = [];
    const flush = () => {
      if (!lines.length) return;
      blocks.push(verse ? { kind: 'verse', lines: lines.map(inline) } : { kind: 'p', runs: inline(lines.join(' ')) });
      lines = [];
    };
    for (const raw of chunk.split('\n')) {
      const line = raw.trim();
      if (BREAK.test(line)) { flush(); blocks.push({ kind: 'break' }); }
      else if (line) lines.push(line);
    }
    flush();
  }
  return blocks;
}

// Words with their italic flag, and whether a space came before them.
function tokens(runs) {
  const out = [];
  let gap = false;
  for (const r of runs) {
    for (const part of r.text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { gap = true; continue; }
      out.push({ text: part, italic: r.italic, gap: gap && out.length > 0 });
      gap = false;
    }
  }
  return out;
}

function runsOf(toks) {
  const runs = [];
  for (const t of toks) {
    const text = (t.gap && runs.length ? ' ' : '') + t.text;
    const last = runs.at(-1);
    if (last && last.italic === t.italic) last.text += text;
    else runs.push({ text, italic: t.italic });
  }
  return runs;
}

export const size = (b) => (b.kind === 'p' ? tokens(b.runs).length : b.kind === 'verse' ? b.lines.length : 1);

/** @returns {[Block, Block]} the first k units, and the rest marked as a continuation */
export function splitBlock(b, k) {
  if (b.kind === 'p') {
    const t = tokens(b.runs);
    return [{ ...b, runs: runsOf(t.slice(0, k)) }, { kind: 'p', runs: runsOf(t.slice(k)), cont: true }];
  }
  if (b.kind === 'verse') return [{ ...b, lines: b.lines.slice(0, k) }, { kind: 'verse', lines: b.lines.slice(k), cont: true }];
  throw new Error('a scene break cannot be split');
}

/**
 * Fills pages in order. A block that does not fit is split at the largest
 * word (or verse line) count that does; a page that cannot take even one unit
 * of an unsplittable block takes it anyway, so layout always moves forward.
 */
export function paginate(blocks, fits, maxPages = 4) {
  const pages = [];
  const queue = [...blocks];
  while (queue.length && pages.length < maxPages) {
    const i = pages.length;
    const page = [];
    while (queue.length) {
      const b = queue[0];
      if (fits(i, [...page, b])) { page.push(queue.shift()); continue; }
      let lo = 0, hi = size(b) - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fits(i, [...page, splitBlock(b, mid)[0]])) lo = mid; else hi = mid - 1;
      }
      if (lo > 0) { const [head, tail] = splitBlock(b, lo); page.push(head); queue[0] = tail; }
      else if (!page.length) page.push(queue.shift());
      break;
    }
    pages.push(page);
  }
  return { pages, truncated: queue.length > 0 };
}
