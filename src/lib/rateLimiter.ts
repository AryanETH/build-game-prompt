/**
 * Simple client-side rate limiter to prevent spam
 * For production, implement server-side rate limiting in Supabase Edge Functions
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if action is allowed
   * @param key - Unique identifier (e.g., 'comment:userId', 'like:userId')
   * @param config - Rate limit configuration
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < config.windowMs
    );
    
    if (validRequests.length >= config.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Preset configurations
export const RATE_LIMITS = {
  COMMENT: { maxRequests: 10, windowMs: 60000 }, // 10 comments per minute
  LIKE: { maxRequests: 30, windowMs: 60000 }, // 30 likes per minute
  MESSAGE: { maxRequests: 20, windowMs: 60000 }, // 20 messages per minute
  GAME_CREATE: { maxRequests: 5, windowMs: 300000 }, // 5 games per 5 minutes
  FOLLOW: { maxRequests: 20, windowMs: 60000 }, // 20 follows per minute
};
