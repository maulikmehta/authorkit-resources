import { paperbackPrintCost, paperbackRoyaltyRate, paperbackRoyalty, paperbackListRange, pageLimits, round2, printedPages, parseTrim, isOffered } from '../shared/kdp.js';
import { US_WITHHOLDING_INDIA, EXPANDED_RATE } from './india.js';

/**
 * @param {{ ink: string, trim: string, pages: string, list: string, fx: string }} input  raw input strings; trim like '6x9'
 * @returns {{ error: string } | {
 *   pages: number, printCost: number, rate: number, royalty: number,
 *   withholding: number, net: number,
 *   expanded: { royalty: number, withholding: number, net: number } | null,
 *   minList: number, inr: null | { royalty: number, net: number, expandedNet: number | null }
 * }}
 */
export function royaltyResult(input) {
  if (!/^\d+$/.test(input.pages)) return { error: 'Enter a valid page count.' };
  let n = parseInt(input.pages, 10);
  const p = printedPages(n);

  const trimArr = parseTrim(input.trim);
  if (!isOffered(input.ink, trimArr)) return { error: 'Choose a trim size.' };
  const [minP, maxP] = pageLimits(input.ink, trimArr);
  if (p < minP || p > maxP) return { error: `Page count must be ${minP}–${maxP} for this paper and trim.` };

  const list = parseFloat(input.list);
  if (isNaN(list) || list <= 0) return { error: 'Enter a valid list price.' };
  if (list > 250) return { error: 'List price is too high.' };

  const printCost = paperbackPrintCost('US', input.ink, trimArr, p);
  const [minList] = paperbackListRange('US', printCost);
  if (list < minList) return { error: `KDP’s minimum list price for this book is $${minList.toFixed(2)}.` };

  const rate = paperbackRoyaltyRate('US', list);
  const royalty = paperbackRoyalty('US', list, printCost);
  const withholding = round2(royalty * US_WITHHOLDING_INDIA);
  const net = round2(royalty - withholding);

  const expandedRoyalty = round2(EXPANDED_RATE * list - printCost);
  let expanded = null;
  if (expandedRoyalty > 0) {
    const expWithholding = round2(expandedRoyalty * US_WITHHOLDING_INDIA);
    expanded = {
      royalty: expandedRoyalty,
      withholding: expWithholding,
      net: round2(expandedRoyalty - expWithholding)
    };
  }

  let inr = null;
  const fx = parseFloat(input.fx);
  if (!isNaN(fx) && fx > 0) {
    inr = {
      royalty: round2(royalty * fx),
      net: round2(net * fx),
      expandedNet: expanded ? round2(expanded.net * fx) : null
    };
  }

  return {
    pages: p, printCost, rate, royalty, withholding, net, expanded, minList, inr
  };
}
