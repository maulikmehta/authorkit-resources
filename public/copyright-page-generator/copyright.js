/** true for a valid ISBN-13 (hyphens/spaces allowed), checksum included. */
export function isIsbn13(s) {
  const digits = s.replace(/[-\s]/g, '');
  if (digits.length !== 13 || !/^\d{13}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[12], 10);
}

/**
 * @param {{
 *   title: string, author: string, holder?: string, year: string,
 *   isbns?: { format: string, isbn: string }[],   // e.g. [{ format: 'Paperback', isbn: '978…' }]
 *   publisher?: string, edition?: string, country: 'IN' | 'US',
 *   rightsReserved?: boolean, fiction?: boolean,
 * }} f
 * @returns {{ lines: string[] } | { error: string }}
 */
export function copyrightPage(f) {
  const title = (f.title || '').trim();
  const author = (f.author || '').trim();
  const holder = (f.holder || '').trim() || author;
  const year = (f.year || '').trim();
  const publisher = (f.publisher || '').trim();
  const edition = (f.edition || '').trim();
  const isbns = f.isbns || [];

  if (!title) return { error: 'Please enter a title.' };
  if (!author) return { error: 'Please enter an author name.' };
  
  const y = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (!/^\d{4}$/.test(year) || y < 1900 || y > currentYear + 1) {
    return { error: 'Please enter a valid 4-digit year.' };
  }

  const lines = [];
  
  // 1. Notice
  lines.push(`Copyright © ${year} ${holder}`);
  
  // 2. All rights reserved
  if (f.rightsReserved) {
    lines.push('All rights reserved.');
    lines.push('No part of this book may be reproduced in any form or by any electronic or mechanical means, including information storage and retrieval systems, without permission in writing from the publisher, except by a reviewer who may quote brief passages in a review.');
  }
  
  // 3. Publisher
  if (publisher) lines.push(`Published by ${publisher}`);
  
  // 4. Edition
  if (edition) lines.push(edition);
  
  // 5. ISBNs
  for (const item of isbns) {
    const isbnStr = (item.isbn || '').trim();
    if (!isbnStr) continue;
    if (!isIsbn13(isbnStr)) {
      return { error: `Invalid ISBN-13: ${isbnStr}. Please check the number.` };
    }
    lines.push(`ISBN ${isbnStr} (${item.format})`);
  }
  
  // 6. Fiction disclaimer
  if (f.fiction) {
    lines.push('This is a work of fiction. Names, characters, businesses, places, events, and incidents are either the products of the author’s imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.');
  }

  return { lines };
}
