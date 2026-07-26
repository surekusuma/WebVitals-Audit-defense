const cheerio = require('cheerio');

/**
 * Counts approximate words in a raw text string, filtering out empty entries.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 0;
  const words = cleaned.split(' ').filter(w => w.length > 0 && !/^[^a-zA-Z0-9]+$/.test(w));
  return words.length;
}

/**
 * Pure parsing function for HTML documents.
 * Extracts title, meta description, H1 headers, image alt attributes, and word count.
 * 
 * @param {string} htmlContent - Raw HTML body string
 * @returns {Object} Parsed page metadata report
 */
function parseHtmlReport(htmlContent) {
  // Handle empty, null, or non-string inputs gracefully
  if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim() === '') {
    return {
      title: null,
      metaDescription: null,
      h1Count: 0,
      h1s: [],
      totalImages: 0,
      missingAltImageCount: 0,
      missingAltImages: [],
      wordCount: 0,
      isEmpty: true
    };
  }

  const $ = cheerio.load(htmlContent);

  // 1. Page Title
  const titleText = $('title').first().text().trim();
  const title = titleText.length > 0 ? titleText : null;

  // 2. Meta Description
  let metaDescription = $('meta[name="description" i]').attr('content') ||
                        $('meta[property="og:description" i]').attr('content') ||
                        $('meta[name="twitter:description" i]').attr('content') ||
                        null;
  if (metaDescription) metaDescription = metaDescription.trim();
  if (metaDescription === '') metaDescription = null;

  // 3. H1 Headers
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1s = [];
  h1Elements.each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) h1s.push(text);
  });

  // 4. Image Alt Audit
  const imgElements = $('img');
  const totalImages = imgElements.length;
  const missingAltImages = [];

  imgElements.each((idx, el) => {
    const altAttr = $(el).attr('alt');
    const srcAttr = $(el).attr('src') || $(el).attr('data-src') || '(no src)';
    // Missing alt if attribute doesn't exist or is purely whitespace
    if (altAttr === undefined || altAttr === null || altAttr.trim() === '') {
      missingAltImages.push({
        index: idx + 1,
        src: srcAttr.length > 100 ? srcAttr.substring(0, 100) + '...' : srcAttr,
        hasAltAttr: altAttr !== undefined && altAttr !== null
      });
    }
  });

  // 5. Word Count
  const bodyClone = $('body').length > 0 ? $('body').clone() : $.root().clone();
  bodyClone.find('script, style, noscript, svg, canvas, iframe, style, code, pre').remove();
  const bodyText = bodyClone.text();
  const wordCount = countWords(bodyText);

  return {
    title,
    metaDescription,
    h1Count,
    h1s,
    totalImages,
    missingAltImageCount: missingAltImages.length,
    missingAltImages,
    wordCount,
    isEmpty: false
  };
}

module.exports = {
  parseHtmlReport,
  countWords
};
