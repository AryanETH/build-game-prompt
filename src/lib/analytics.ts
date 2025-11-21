/**
 * Analytics utility - Ready for PostHog, Google Analytics, or custom tracking
 * Currently logs to console, replace with actual analytics service
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

class Analytics {
  private enabled: boolean = true;
  private userId: string | null = null;

  /**
   * Initialize analytics with user ID
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    if (this.enabled) {
      console.log('[Analytics] Identify:', { userId, traits });
      // TODO: Replace with actual analytics service
      // posthog.identify(userId, traits);
      // gtag('set', 'user_id', userId);
    }
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const eventData: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      },
      userId: this.userId || undefined,
    };

    console.log('[Analytics] Track:', eventData);
    // TODO: Replace with actual analytics service
    // posthog.capture(event, properties);
    // gtag('event', event, properties);
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: Record<string, any>): void {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  /**
   * Disable analytics
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Enable analytics
   */
  enable(): void {
    this.enabled = true;
  }
}

export const analytics = new Analytics();

// Predefined events for consistency
export const ANALYTICS_EVENTS = {
  // User events
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Game events
  GAME_CREATED: 'game_created',
  GAME_PLAYED: 'game_played',
  GAME_LIKED: 'game_liked',
  GAME_SHARED: 'game_shared',
  GAME_REMIXED: 'game_remixed',
  
  // Social events
  USER_FOLLOWED: 'user_followed',
  COMMENT_POSTED: 'comment_posted',
  MESSAGE_SENT: 'message_sent',
  
  // Feed events
  FEED_SCROLLED: 'feed_scrolled',
  FEED_TAB_CHANGED: 'feed_tab_changed',
  
  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
};
