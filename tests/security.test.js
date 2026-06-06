/**
 * @jest-environment jsdom
 */
const { sanitizeHTML } = require('../js/app.js');

describe('Security: XSS Prevention', () => {
  test('sanitizeHTML escapes dangerous characters', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const safeOutput = sanitizeHTML(maliciousInput);
    
    expect(safeOutput).not.toContain('<script>');
    expect(safeOutput).toContain('&lt;script&gt;');
  });

  test('sanitizeHTML handles null or empty input gracefully', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML('')).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
  });
});
