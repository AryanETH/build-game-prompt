import DOMPurify from 'dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * @param dirty - Untrusted user input
 * @returns Sanitized safe string
 */
export function sanitizeInput(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * Sanitize HTML content (for rich text)
 * @param dirty - Untrusted HTML content
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

/**
 * Validate and sanitize URL
 * @param url - URL to validate
 * @returns Safe URL or empty string
 */
export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return DOMPurify.sanitize(url);
    }
    return '';
  } catch {
    return '';
  }
}
