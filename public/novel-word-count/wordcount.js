/**
 * @param {string} wordsInput  raw text from the input
 * @param {string} trim        trim id, a key of wordsPerPage
 * @param {Record<string, number>} wordsPerPage
 * @returns {{ pages: number } | { error: string }}  pages is even (KDP prints even counts)
 */
export function estimatePages(wordsInput, trim, wordsPerPage) {
  const s = String(wordsInput).replace(/[\s,]/g, '');
  if (!/^\d+$/.test(s)) return { error: 'Enter a word count, like 80000.' };

  const words = parseInt(s, 10);
  if (words <= 0 || words > 1000000) return { error: 'Enter a word count, like 80000.' };

  if (!wordsPerPage[trim]) return { error: 'Choose a trim size.' };

  const wpp = wordsPerPage[trim];
  let pages = Math.ceil(words / wpp);
  pages += (pages % 2);

  return { pages };
}

/** Genres whose range contains `words`. A null `max` means no upper bound. */
export function genresFor(words, genres) {
  return genres.filter((g) => words >= g.min && (g.max === null || words <= g.max));
}
