/** Source: https://kdp.amazon.com/en_US/help/topic/G201189630 (checked 2026-09-29) */
export const MAX_CHARS = 4000;
export const ALLOWED = ['p', 'br', 'b', 'i', 'em', 'u', 'h4', 'h5', 'h6', 'ol', 'ul', 'li'];

/** @returns {{ html: string, chars: number, over: boolean }} chars counted the way KDP counts */
// Tag stack check: every close matches the latest open, nothing left open.
function balanced(html) {
  const stack = [];
  for (const [, close, name] of html.matchAll(/<(\/?)([a-z]+)>/g)) {
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}

// Marks apply within one line only. A span is kept only if it has real text and
// its tags nest cleanly; otherwise the asterisks stay literal.
const wrap = (open, close) => (m, inner) =>
  /[^*\s]/.test(inner) && balanced(inner) ? open + inner + close : m;

function mark(line) {
  return line
    .replace(/\*\*\*([^\n]+?)\*\*\*/g, wrap('<b><i>', '</i></b>'))
    .replace(/\*\*([^\n]+?)\*\*/g, wrap('<b>', '</b>'))
    .replace(/(^|[^*])\*([^*\s][^*\n]*?)\*(?!\*)/g, (m, pre, inner) => {
      const r = wrap('<i>', '</i>')(m.slice(pre.length), inner);
      return r === m.slice(pre.length) ? m : pre + r;
    });
}

export function formatDescription(text) {
  if (!text || !text.trim()) {
    return { html: '', chars: 0, over: false };
  }
  
  let str = text.replace(/\r\n/g, '\n').trim();
  
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  str = str.replace(/[&<>"]/g, c => escapeMap[c]);
  
  const blocks = str.split(/\n{2,}/);
  
  const formattedBlocks = blocks.map(block => {
    const lines = block.split('\n').map(mark);
    if (lines.length > 0 && lines.every(line => line.startsWith('- '))) {
      const items = lines.map(line => `<li>${line.substring(2)}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${lines.join('<br>')}</p>`;
  });
  
  const html = formattedBlocks.join('');
  
  return {
    html,
    chars: html.length,
    over: html.length > MAX_CHARS
  };
}
