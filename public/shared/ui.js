// Display helpers shared by the tools. KDP numbers stay in kdp.js.
import { trimsFor, isOffered, trimId, parseTrim } from './kdp.js';

/** Keep the chosen trim if this ink offers it, else the ink's first trim. */
export function pickTrim(ink, currentId) {
  return currentId && isOffered(ink, parseTrim(currentId)) ? currentId : trimId(trimsFor(ink)[0]);
}

/** A length in inches, with millimetres: 0.500″ (12.7 mm). */
export const fmt = (inches) => `${inches.toFixed(3)}″ (${(inches * 25.4).toFixed(1)} mm)`;

/** Short option text keeps the paper visible at 390px; KDP's own wording shows under the select. */
export const INK_SHORT = Object.freeze({
  'bw-cream': 'Cream paper, black & white',
  'bw-white': 'White paper, black & white',
  'bw-groundwood': 'Groundwood paper, black & white',
  'standard-color': 'White paper, standard color',
  'premium-color': 'White paper, premium color',
});
