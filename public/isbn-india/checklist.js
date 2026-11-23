const RRRNA_HOW_TO_APPLY = 'https://isbn.gov.in/Home/ViewManual?fileName=SelfPublishedAuthor5df90f7a-e92f-40a1-a57f-6f17d9eff2b8.pdf';
const RRRNA_FAQS = 'https://isbn.gov.in/Home/ViewManual?fileName=Faqsaf175205-54c5-4501-a09e-284f4f161809.pdf';
const KDP_ISBN = 'https://kdp.amazon.com/en_US/help/topic/G201834170';

/**
 * Checklist items following RRRNA How to Apply steps and quoted portal guidance.
 * Numbers live only in quotes.
 * @type {{ id: string, title: string, detail: string, quote: string, source: string, sourceTitle: string }[]}
 */
export const ITEMS = [
  {
    id: 'category',
    title: 'Select the self published author category',
    detail: 'Apply under the category for authors who publish their own work independently.',
    quote: 'an individual who independently publishes their work without the involvement of an established third-party publisher.',
    source: RRRNA_HOW_TO_APPLY,
    sourceTitle: 'RRRNA: How to Apply — Self Published by Author',
  },
  {
    id: 'documents',
    title: 'Prepare applicant identity and address documents',
    detail: 'Check the document requirements shown when selecting your applicant type on the portal.',
    quote: 'can be seen when choosing Applicant and Publisher type while registering in the Portal',
    source: RRRNA_FAQS,
    sourceTitle: 'RRRNA: FAQs',
  },
  {
    id: 'no-changes-after-submitting',
    title: 'Review title details before submitting',
    detail: 'Make sure all details are complete and correct because you cannot edit them later.',
    quote: 'no alterations can be made under any circumstances',
    source: RRRNA_HOW_TO_APPLY,
    sourceTitle: 'RRRNA: How to Apply — Self Published by Author',
  },
  {
    id: 'one-isbn-per-format',
    title: 'Request a separate ISBN for each format',
    detail: 'Hardcover, paperback and digital editions each require their own identifier.',
    quote: 'different formats need different ISBNs in order, for example, that a customer who wants to buy a book in hardback rather than paperback can be confident that they will receive the correct format.',
    source: RRRNA_FAQS,
    sourceTitle: 'RRRNA: FAQs',
  },
  {
    id: 'final-title-verso-page',
    title: 'Upload your final title verso page',
    detail: 'Include the copyright page or book cover so the application details can be verified against the book.',
    quote: 'to ensure that the details in the application match the book accurately.',
    source: RRRNA_HOW_TO_APPLY,
    sourceTitle: 'RRRNA: How to Apply — Self Published by Author',
  },
  {
    id: 'translation',
    title: 'Provide English or Hindi translation if required',
    detail: 'Books in languages other than Hindi and English need a Hindi or English translation.',
    quote: 'for our verification purposes only.',
    source: RRRNA_HOW_TO_APPLY,
    sourceTitle: 'RRRNA: How to Apply — Self Published by Author',
  },
  {
    id: 'matching-details-in-kdp',
    title: 'Match book details between your ISBN and KDP',
    detail: 'Enter identical title, author and publisher metadata in KDP to prevent publishing blocks.',
    quote: 'must enter the same details (i.e. book title, author name, publisher) in KDP that you used to register the ISBN',
    source: KDP_ISBN,
    sourceTitle: 'KDP: What is an ISBN and Imprint?',
  },
  {
    id: 'barcode',
    title: 'Generate your barcode separately',
    detail: 'The ISBN is an identifier number and does not come with a barcode image from the agency.',
    quote: 'is not the Authorized Organization to provide the Barcode for ISBN',
    source: RRRNA_FAQS,
    sourceTitle: 'RRRNA: FAQs',
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
