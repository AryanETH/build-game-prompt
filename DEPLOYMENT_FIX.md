# Fix: 404 Error on Page Reload

## Problem
When you reload any page (like `/profile`, `/game/123`, etc.), you get a 404 error because the server looks for that actual file, which doesn't exist in a Single Page Application (SPA).

## Solution
Configure your hosting platform to redirect all requests to `index.html`, allowing React Router to handle the routing.

---

## ✅ VERCEL (Your Current Platform)

### Files Created:
- `vercel.json` ✓

### What It Does:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel: "For ANY URL path, serve `index.html` and let React Router handle it."

### Deploy Steps:
1. **Commit the new `vercel.json` file:**
   ```bash
   git add vercel.json
   git commit -m "Fix: Add Vercel SPA routing configuration"
   git push
   ```

2. **Vercel will auto-deploy** (if connected to GitHub)

3. **Test it:**
   - Visit `https://oplusai.vercel.app/profile`
   - Reload the page (F5 or Ctrl+R)
   - Should work now! ✓

### Manual Deploy (if needed):
```bash
npm run build
vercel --prod
```

---

## 🔄 NETLIFY (Alternative)

### Files Created:
- `netlify.toml` ✓
- `public/_redirects` ✓

### What It Does:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Deploy Steps:
1. Connect your repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!

---

## 🚀 OTHER PLATFORMS

### **Cloudflare Pages**
Create `_redirects` in `public/`:
```
/*    /index.html   200
```

### **GitHub Pages**
Add to `public/404.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/'">
  </head>
</html>
```

Then in `src/main.tsx`, add:
```typescript
const redirect = sessionStorage.redirect;
delete sessionStorage.redirect;
if (redirect && redirect !== location.href) {
  history.replaceState(null, '', redirect);
}
```

### **Firebase Hosting**
In `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### **AWS S3 + CloudFront**
In CloudFront distribution:
- Error Pages → Create Custom Error Response
- HTTP Error Code: 404
- Response Page Path: `/index.html`
- HTTP Response Code: 200

### **Nginx**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### **Apache (.htaccess)**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🧪 Testing

After deploying, test these URLs:

1. **Direct navigation** (should work):
   - `https://oplusai.vercel.app/`
   - `https://oplusai.vercel.app/profile`
   - `https://oplusai.vercel.app/game/123`

2. **Reload test** (should work now):
   - Visit `/profile`
   - Press F5 or Ctrl+R
   - Should stay on `/profile` ✓

3. **Deep link test** (should work):
   - Share link: `https://oplusai.vercel.app/game/abc123`
   - Open in new tab
   - Should load the game ✓

---

## 🔍 Why This Happens

### Without Fix:
```
User visits: https://oplusai.vercel.app/profile
Browser requests: /profile from server
Server looks for: /profile.html or /profile/index.html
Server finds: Nothing! 404 error ❌
```

### With Fix:
```
User visits: https://oplusai.vercel.app/profile
Browser requests: /profile from server
Server redirects: All requests → /index.html
React loads: index.html
React Router: Sees URL is /profile
React Router: Renders Profile component ✓
```

---

## 📊 Performance Impact

**None!** This is a server-side rewrite, not a redirect:
- No extra HTTP requests
- No performance penalty
- Same load time
- SEO-friendly (200 status, not 301/302)

---

## 🛡️ Security Headers Added

The `vercel.json` also includes security headers:

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
}
```

These protect against:
- MIME type sniffing attacks
- Clickjacking
- Cross-site scripting (XSS)

---

## 🎯 Quick Fix Checklist

- [x] Created `vercel.json`
- [x] Created `netlify.toml` (backup)
- [x] Created `public/_redirects` (backup)
- [x] Updated `vite.config.ts` (build optimization)
- [ ] Commit and push changes
- [ ] Wait for auto-deploy
- [ ] Test reload on any page
- [ ] Celebrate! 🎉

---

## 🆘 Still Not Working?

### Check Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → General
4. Check "Framework Preset" is set to "Vite"
5. Check "Build Command" is `npm run build`
6. Check "Output Directory" is `dist`

### Force Redeploy:
```bash
# Option 1: Push a new commit
git commit --allow-empty -m "Force redeploy"
git push

# Option 2: Redeploy from Vercel dashboard
# Deployments → Latest → ... → Redeploy
```

### Clear Cache:
```bash
# In Vercel dashboard
Settings → General → Clear Cache → Save
```

---

## 📝 Summary

**What we fixed:**
- ✅ 404 errors on page reload
- ✅ Deep linking support
- ✅ Shareable URLs work correctly
- ✅ Added security headers
- ✅ Optimized build configuration

**What you need to do:**
1. Commit `vercel.json`
2. Push to GitHub
3. Wait 1-2 minutes for deploy
4. Test by reloading any page

**That's it!** Your SPA routing is now properly configured.
