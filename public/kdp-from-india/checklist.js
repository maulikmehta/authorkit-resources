const KDP_MARKETPLACES = 'https://kdp.amazon.com/en_US/help/topic/G201834280';
const KDP_LANGUAGES = 'https://kdp.amazon.com/en_US/help/topic/G200673300';
const KDP_TAX = 'https://kdp.amazon.com/en_US/help/topic/G201274690';
const IRS_TREATY = 'https://www.irs.gov/pub/irs-trty/india.pdf';
const KDP_PAYMENTS = 'https://kdp.amazon.com/en_US/help/topic/G201207800';
const GST_EBOOK = 'https://www.gstcouncil.gov.in/sites/default/files/2024-05/download_2024-05-17t160210.063.pdf';
const ITD_FORM67 = 'https://www.incometax.gov.in/iec/foportal/help/statutory-forms/popular-form/form67-um';

/**
 * Checklist items for Indian authors setting up an Amazon KDP account.
 * Numbers live only in quotes (form names such as Form 67 are allowed).
 * @type {{ id: string, title: string, detail: string, quote: string, source: string, sourceTitle: string }[]}
 */
export const ITEMS = [
  {
    id: 'marketplaces-formats',
    title: 'Check marketplace availability for print distribution',
    detail: 'Verify where your paperback can be sold because print distribution is not available in every marketplace.',
    quote: 'amazon.com.br, amazon.com.in, and amazon.com.mx do not support paperback and hardcover distribution.',
    source: KDP_MARKETPLACES,
    sourceTitle: 'KDP: Paperback and hardcover marketplaces',
  },
  {
    id: 'supported-languages',
    title: 'Confirm format eligibility for your book language',
    detail: 'Check whether your language is supported for print or restricted to digital editions.',
    quote: 'eBook only',
    source: KDP_LANGUAGES,
    sourceTitle: 'KDP: Supported languages',
  },
  {
    id: 'tax-interview',
    title: 'Complete the tax interview in your KDP account',
    detail: 'KDP withholds US tax from some royalties. Your tax interview shows which rate KDP applies to you.',
    quote: 'are subject to 30% US tax withholding',
    source: KDP_TAX,
    sourceTitle: 'KDP: Royalty tax information',
  },
  {
    id: 'treaty-rate',
    title: 'Check the treaty rate your tax interview gives you',
    detail: 'The India-US tax treaty caps US tax on royalties. Confirm which rate KDP applies to you.',
    quote: 'shall not exceed',
    source: IRS_TREATY,
    sourceTitle: 'IRS: India tax treaty, Article 12',
  },
  {
    id: 'payment-method',
    title: 'Set up electronic direct deposit for royalty payouts',
    detail: 'Choose electronic bank transfer to receive payouts without waiting to cross a minimum earnings threshold.',
    quote: 'you\x27ll be paid electronically in full no matter the amount accrued.',
    source: KDP_PAYMENTS,
    sourceTitle: 'KDP: Payment thresholds',
  },
  {
    id: 'ca-foreign-tax-credit',
    title: 'Review foreign tax withholding credit under Form 67 with your CA',
    detail: 'Consult your chartered accountant about claiming credit for American withholding tax using Form 67 on your Indian return.',
    quote: 'a resident taxpayer who has credit for the amount of any foreign tax paid in a country outside India',
    source: ITD_FORM67,
    sourceTitle: 'Income Tax Department: Form 67',
  },
  {
    id: 'ca-gst-ebooks',
    title: 'Ask your CA how GST applies to your ebook sales',
    detail: 'Ebooks have their own GST entry, separate from printed books.',
    quote: 'Supply consisting only of e-book',
    source: GST_EBOOK,
    sourceTitle: 'GST Council: Notification 13/2018-Central Tax (Rate)',
  },
];

/** Formats the items array as plain text for download. */
export function checklistText(items) {
  return items.map((i) => `[ ] ${i.title}\n    \u201c${i.quote}\u201d\n    ${i.source}`).join('\n\n') + '\n';
}

/** @param {Set<string>} done ids ticked @returns {{ done: number, total: number }} */
export function progress(done) {
  return { done: ITEMS.filter((i) => done.has(i.id)).length, total: ITEMS.length };
}
