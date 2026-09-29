/** Source: https://kdp.amazon.com/en_US/help/topic/G201189630 (checked 2026-09-29) */
export const MAX_CHARS = 4000;
export const ALLOWED = ['p', 'br', 'b', 'i', 'em', 'u', 'h4', 'h5', 'h6', 'ol', 'ul', 'li'];

/** @returns {{ html: string, chars: number, over: boolean }} chars counted the way KDP counts */
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
  
  str = str.replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>');
  str = str.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // An italic span must not contain half of a bold pair, or the tags would overlap.
  str = str.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, (m, pre, inner) =>
    inner.split('<b>').length === inner.split('</b>').length ? `${pre}<i>${inner}</i>` : m);
  
  const blocks = str.split(/\n{2,}/);
  
  const formattedBlocks = blocks.map(block => {
    const lines = block.split('\n');
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
