const { parseHtmlReport, countWords } = require('../lib/parser');

describe('Page Pulse HTML Parser — Unit Tests', () => {

  // --- 1. HAPPY PATH TEST ---
  describe('Happy Path Execution', () => {
    test('should correctly parse a complete, well-formed HTML document', () => {
      const sampleHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title> Digital Heroes Test Page </title>
          <meta name="description" content="A comprehensive test page for auditing performance and accessibility.">
        </head>
        <body>
          <h1>Main Hero Heading</h1>
          <p>Welcome to Page Pulse auditing tool. We test web pages for SEO and accessibility.</p>
          <h1>Secondary Section Header</h1>
          <img src="https://example.com/hero.jpg" alt="Hero Banner Artwork">
          <img src="https://example.com/missing1.png">
          <img src="https://example.com/empty.png" alt="   ">
        </body>
        </html>
      `;

      const result = parseHtmlReport(sampleHtml);

      // Verify Title
      expect(result.title).toBe('Digital Heroes Test Page');

      // Verify Meta Description
      expect(result.metaDescription).toBe('A comprehensive test page for auditing performance and accessibility.');

      // Verify H1 Headers
      expect(result.h1Count).toBe(2);
      expect(result.h1s).toEqual(['Main Hero Heading', 'Secondary Section Header']);

      // Verify Image Accessibility
      expect(result.totalImages).toBe(3);
      expect(result.missingAltImageCount).toBe(2);
      expect(result.missingAltImages.length).toBe(2);
      expect(result.missingAltImages[0].src).toBe('https://example.com/missing1.png');

      // Verify Word Count (Approximate words in body text)
      expect(result.wordCount).toBeGreaterThan(10);
      expect(result.isEmpty).toBe(false);
    });
  });

  // --- 2. FAILURE CASE 1: EMPTY / NULL INPUT ---
  describe('Failure Case 1 — Empty or Malformed Input', () => {
    test('should handle null input gracefully without throwing exception', () => {
      const result = parseHtmlReport(null);
      expect(result.title).toBeNull();
      expect(result.h1Count).toBe(0);
      expect(result.missingAltImageCount).toBe(0);
      expect(result.wordCount).toBe(0);
      expect(result.isEmpty).toBe(true);
    });

    test('should handle empty string input gracefully', () => {
      const result = parseHtmlReport('    ');
      expect(result.title).toBeNull();
      expect(result.h1Count).toBe(0);
      expect(result.wordCount).toBe(0);
      expect(result.isEmpty).toBe(true);
    });
  });

  // --- 3. FAILURE CASE 2: NON-HTML / PLAIN TEXT / JSON INPUT ---
  describe('Failure Case 2 — Non-HTML / JSON Response', () => {
    test('should parse raw JSON payload without crashing', () => {
      const jsonString = '{"status": "error", "code": 500, "message": "Internal server error"}';
      const result = parseHtmlReport(jsonString);

      expect(result.title).toBeNull();
      expect(result.metaDescription).toBeNull();
      expect(result.h1Count).toBe(0);
      expect(result.totalImages).toBe(0);
      expect(result.missingAltImageCount).toBe(0);
      expect(result.isEmpty).toBe(false);
    });
  });

  // --- 4. EDGE CASE: HTML MISSING TITLE AND META ---
  describe('Edge Cases', () => {
    test('should handle HTML snippet with missing title and meta tags', () => {
      const htmlSnippet = `<div><h1>Only H1 Tag</h1><p>Some content body text.</p></div>`;
      const result = parseHtmlReport(htmlSnippet);

      expect(result.title).toBeNull();
      expect(result.metaDescription).toBeNull();
      expect(result.h1Count).toBe(1);
      expect(result.h1s).toEqual(['Only H1 Tag']);
      expect(result.wordCount).toBe(6);
    });

    test('countWords utility should clean excessive spaces and symbols', () => {
      expect(countWords('   Hello   world!   123  ')).toBe(3);
      expect(countWords('--- *** ///')).toBe(0);
      expect(countWords(null)).toBe(0);
    });
  });

});
