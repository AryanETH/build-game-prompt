# 🚀 Oplus Production Setup Guide

This guide covers the essential steps to make Oplus production-ready.

## ✅ Already Implemented

### Security
- ✅ Input sanitization with DOMPurify
- ✅ Client-side rate limiting
- ✅ Supabase Row Level Security (RLS)
- ✅ Authentication with Supabase Auth

### Performance
- ✅ Lazy loading with React.lazy
- ✅ Code splitting by route
- ✅ TanStack Query for caching
- ✅ Optimistic UI updates
- ✅ Performance monitoring utilities

### Monitoring (Ready to integrate)
- ✅ Error tracking utility (ready for Sentry)
- ✅ Analytics utility (ready for PostHog/GA)
- ✅ Performance monitoring

## 🔧 Next Steps for Production

### 1. Error & Crash Monitoring

#### Option A: Sentry (Recommended)
```bash
npm install @sentry/react
```

Update `src/lib/errorTracking.ts`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

#### Option B: LogRocket
```bash
npm install logrocket
```

### 2. Analytics

#### Option A: PostHog (Recommended - Open Source)
```bash
npm install posthog-js
```

Update `src/lib/analytics.ts`:
```typescript
import posthog from 'posthog-js';

posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://app.posthog.com'
});
```

#### Option B: Google Analytics 4
```bash
npm install react-ga4
```

### 3. Testing

#### Install Testing Tools
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
```

#### Add test scripts to package.json:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test"
  }
}
```

### 4. CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### 5. Image Optimization

```bash
npm install react-lazy-load-image-component
```

### 6. Push Notifications

#### Firebase Cloud Messaging
```bash
npm install firebase
```

Create `firebase-messaging-sw.js` in public folder.

### 7. Admin Dashboard

Create admin routes:
- `/admin/users` - User management
- `/admin/games` - Game moderation
- `/admin/reports` - Handle reports
- `/admin/analytics` - View metrics

### 8. Rate Limiting (Server-side)

Update Supabase Edge Functions with rate limiting:

```typescript
// supabase/functions/_shared/rateLimit.ts
import { createClient } from '@supabase/supabase-js'

export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  // Implement Redis-based rate limiting
  // Or use Supabase to track request counts
}
```

### 9. Caching Layer (Optional)

#### Upstash Redis
```bash
npm install @upstash/redis
```

Cache:
- Feed queries
- Trending games
- User profiles
- Game metadata

### 10. Environment Variables

Create `.env.production`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SENTRY_DSN=your_sentry_dsn
VITE_POSTHOG_KEY=your_posthog_key
VITE_GA_MEASUREMENT_ID=your_ga_id
```

## 🔒 Security Checklist

- [ ] Enable Supabase rate limiting
- [ ] Add CAPTCHA for signup/login
- [ ] Implement content moderation
- [ ] Add report system for games/users
- [ ] Enable HTTPS only
- [ ] Set up CORS properly
- [ ] Add CSP headers
- [ ] Implement session timeout
- [ ] Add 2FA option

## 📊 Monitoring Checklist

- [ ] Set up Sentry error tracking
- [ ] Configure PostHog analytics
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Configure performance alerts
- [ ] Set up log aggregation
- [ ] Monitor database performance
- [ ] Track API response times

## 🚀 Deployment Checklist

- [ ] Run production build test
- [ ] Check bundle size (< 500KB initial)
- [ ] Test on mobile devices
- [ ] Test on slow 3G connection
- [ ] Verify SEO meta tags
- [ ] Test social sharing
- [ ] Verify sitemap.xml
- [ ] Test PWA functionality
- [ ] Check accessibility (WCAG)
- [ ] Load test with 1000+ concurrent users

## 📈 Performance Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

## 🎯 Success Metrics to Track

1. **User Engagement**
   - Daily Active Users (DAU)
   - Games created per day
   - Average session duration
   - Feed scroll depth

2. **Performance**
   - Page load time
   - API response time
   - Error rate
   - Crash-free rate

3. **Growth**
   - New signups
   - Retention rate (D1, D7, D30)
   - Viral coefficient
   - Share rate

## 📞 Support

For production issues:
1. Check Sentry for errors
2. Review PostHog analytics
3. Check Supabase logs
4. Monitor Vercel deployment logs

---

**Last Updated**: November 2024
**Version**: 1.0.0
