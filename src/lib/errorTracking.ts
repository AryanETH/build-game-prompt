/**
 * Error tracking utility - Ready for Sentry or LogRocket
 * Currently logs to console, replace with actual error tracking service
 */

interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private enabled: boolean = true;
  private userId: string | null = null;

  /**
   * Initialize error tracking with user context
   */
  setUser(userId: string, email?: string, username?: string): void {
    this.userId = userId;
    if (this.enabled) {
      console.log('[ErrorTracking] Set user:', { userId, email, username });
      // TODO: Replace with actual error tracking service
      // Sentry.setUser({ id: userId, email, username });
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.enabled) return;

    console.error('[ErrorTracking] Exception:', {
      error: error.message,
      stack: error.stack,
      context: {
        ...context,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    });

    // TODO: Replace with actual error tracking service
    // Sentry.captureException(error, { contexts: { custom: context } });
  }

  /**
   * Capture a message (non-error)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.enabled) return;

    console.log(`[ErrorTracking] ${level.toUpperCase()}:`, {
      message,
      context: {
        ...context,
        userId: this.userId,
        timestamp: new Date().toISOString(),
      },
    });

    // TODO: Replace with actual error tracking service
    // Sentry.captureMessage(message, level);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    if (!this.enabled) return;

    console.log('[ErrorTracking] Breadcrumb:', {
      message,
      category,
      data,
      timestamp: new Date().toISOString(),
    });

    // TODO: Replace with actual error tracking service
    // Sentry.addBreadcrumb({ message, category, data });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = null;
    // Sentry.setUser(null);
  }
}

export const errorTracker = new ErrorTracker();

// Setup global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureException(event.error, {
      component: 'window',
      action: 'unhandled_error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureException(
      new Error(event.reason),
      {
        component: 'window',
        action: 'unhandled_promise_rejection',
      }
    );
  });
}
