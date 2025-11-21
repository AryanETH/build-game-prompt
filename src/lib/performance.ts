/**
 * Performance monitoring utility
 * Tracks page load times, API calls, and user interactions
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return;
    performance.mark(name);
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (!this.enabled) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measure = performance.getEntriesByName(name)[0] as PerformanceEntry;
      const duration = measure.duration;

      this.metrics.push({
        name,
        value: duration,
        timestamp: Date.now(),
      });

      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    } catch (error) {
      console.warn('[Performance] Measurement failed:', error);
      return null;
    }
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, duration: number, success: boolean): void {
    if (!this.enabled) return;

    this.metrics.push({
      name: `api_${endpoint}_${success ? 'success' : 'error'}`,
      value: duration,
      timestamp: Date.now(),
    });

    if (duration > 3000) {
      console.warn(`[Performance] Slow API call: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): void {
    if (!this.enabled || typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('[Performance] FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      });
      console.log('[Performance] CLS:', clsScore);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.enabled = true;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Initialize Core Web Vitals tracking
if (typeof window !== 'undefined') {
  performanceMonitor.getCoreWebVitals();
}
