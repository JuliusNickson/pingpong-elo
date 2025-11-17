# 🧪 PWA Testing & Verification Guide

## Quick Start

```bash
npm run build:web    # Build production PWA
npm run serve:web    # Serve at http://localhost:8080
```

Open http://localhost:8080 and follow the tests below.

---

## ✅ Phase 5: Firebase Auth & Firestore on Web

### Test 1: Firebase Modular SDK
**Expected**: All Firebase imports use modular SDK (`firebase/app`, `firebase/auth`, `firebase/firestore`)

```bash
# Check imports
grep -r "from 'firebase/" utils/*.js
```

**✅ Verified**: 
- ✅ `firebase/app` - initializeApp
- ✅ `firebase/auth` - getAuth, setPersistence, browserLocalPersistence
- ✅ `firebase/firestore` - getFirestore, enableIndexedDbPersistence

### Test 2: Auth Persistence
**Expected**: Users stay logged in after page refresh

**Steps**:
1. Open http://localhost:8080
2. Login with test account
3. Refresh page (Cmd+R / Ctrl+R)
4. **Expected**: Still logged in, no redirect to login page
5. Close tab and reopen
6. **Expected**: Still logged in

**Implementation**:
```javascript
// utils/firebase.js
setPersistence(auth, browserLocalPersistence)
```

### Test 3: Firestore Security Rules
**Expected**: Unauthenticated access blocked, authenticated access allowed

**Manual Test**:
1. **Apply rules first**: Copy `firestore.rules` to Firebase Console
   - Go to: https://console.firebase.google.com/project/pingpong-elo-27d40/firestore/rules
   - Paste rules from `firestore.rules` file
   - Click "Publish"

2. **Test unauthenticated access** (should fail):
   ```javascript
   // Before logging in, open browser console:
   fetch('https://firestore.googleapis.com/v1/projects/pingpong-elo-27d40/databases/(default)/documents/users')
     .then(r => r.json())
     .then(console.log)
   // Expected: Error 403 or authentication required
   ```

3. **Test authenticated access** (should work):
   - Login to the app
   - Navigate to Leaderboard
   - **Expected**: See list of players

**Security Rules Applied**:
- ✅ `/users/{uid}` - Read: any auth, Write: temp all auth (for match acceptance)
- ✅ `/matchRequests/{id}` - Read/Write: participants only
- ✅ `/matches/{id}` - Read: any auth, Write: participants only (immutable)

---

## ✅ Phase 6: Offline & Installable

### Test 4: Service Worker Registration
**Expected**: Service worker registered and active

**Steps**:
1. Open http://localhost:8080
2. Open Chrome DevTools (F12)
3. Go to **Application** tab
4. Click **Service Workers** (left sidebar)

**Expected Results**:
- ✅ Status: **activated and is running**
- ✅ Source: `/service-worker.js`
- ✅ Update on reload: Checked

**Alternative**:
Visit `chrome://inspect/#service-workers` and look for localhost:8080

**Console Check**:
```javascript
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('SW registered:', reg))
  .catch(err => console.log('SW not registered:', err))
```

### Test 5: PWA Installation
**Expected**: App can be installed as standalone application

#### Desktop (Chrome/Edge)
1. Visit http://localhost:8080
2. Look for **install icon** (⊕ or ⬇) in address bar (right side)
3. Click install icon
4. Click "Install" in popup
5. **Expected**: App opens in new window without browser chrome
6. Check Applications folder / Start Menu for "PingPongElo"

#### Mobile (Chrome Android)
1. Visit http://localhost:8080
2. Tap **⋮ menu** (3 dots)
3. Select **"Add to Home screen"**
4. Tap "Add"
5. **Expected**: Icon appears on home screen
6. Tap icon → App opens fullscreen

#### Mobile (Safari iOS)
1. Visit http://localhost:8080
2. Tap **Share button** (square with arrow)
3. Scroll and tap **"Add to Home Screen"**
4. Tap "Add"
5. **Expected**: Icon on home screen
6. Tap icon → App opens fullscreen

**Troubleshooting "Install" not showing**:
- ✅ HTTPS required (localhost is OK)
- ✅ Valid manifest.json
- ✅ Service worker registered
- ✅ Icons 192x192 and 512x512
- ⚠️ Some browsers require 2-3 visits before showing prompt
- ⚠️ iOS Safari requires manual "Add to Home Screen" (no install prompt)

### Test 6: Offline Mode
**Expected**: App works without internet after first load

**Steps**:
1. Visit http://localhost:8080
2. Login and browse app (loads data into cache)
3. **Disconnect internet** (turn off WiFi or use Chrome DevTools)
   - DevTools: **Network** tab → **Offline** checkbox
4. Refresh page (Cmd+R / Ctrl+R)
5. **Expected**: App loads from cache, UI visible
6. Navigate between pages
7. **Expected**: Cached pages work

**What Works Offline**:
- ✅ App shell (HTML, CSS, JS)
- ✅ Previously loaded pages
- ✅ Icons and images
- ✅ Manifest

**What Doesn't Work Offline** (expected):
- ❌ New Firestore queries (data fetch)
- ❌ Login/register (requires server)
- ❌ Match requests (requires Firestore)

**Partial Offline** (with IndexedDB persistence):
- ⚠️ Firestore enables some offline reads of cached data
- ⚠️ Writes queued until back online

---

## 🔍 Chrome DevTools Inspection

### Application Tab Checklist

#### **Manifest**
- ✅ Name: "Ping Pong Elo Rankings"
- ✅ Short name: "PingPongElo"
- ✅ Start URL: "/"
- ✅ Display: "standalone"
- ✅ Theme color: "#0066CC"
- ✅ Icons: 192x192, 512x512
- ✅ No errors or warnings

#### **Service Workers**
- ✅ Status: "activated and is running"
- ✅ Source: "/service-worker.js"
- ✅ Scope: "/"
- ✅ Update on reload: checked

#### **Cache Storage**
- ✅ Cache name: "pingpong-elo-v1"
- ✅ Cached files:
  - `/` (root)
  - `/manifest.json`
  - `/icons/icon-192.png`
  - `/icons/icon-512.png`

#### **IndexedDB**
- ✅ firebase-firestore-db (if using offline persistence)
- ✅ Contains cached Firestore documents

#### **Local Storage**
- ✅ firebase:authUser (authentication state)
- ✅ firebase:host (Firebase config)

---

## 🎯 Lighthouse PWA Audit

### Run Lighthouse Audit

1. Open http://localhost:8080
2. Open Chrome DevTools (F12)
3. Go to **Lighthouse** tab
4. Select **Progressive Web App**
5. Click **Analyze page load**

### Target Scores

| Category | Target | Notes |
|----------|--------|-------|
| PWA | 90+ | Must pass all PWA checks |
| Performance | 90+ | Static site should be fast |
| Accessibility | 90+ | Good color contrast, labels |
| Best Practices | 90+ | HTTPS, no console errors |
| SEO | 80+ | Meta tags, structured data |

### PWA Checklist (Lighthouse)

**Core Progressive Web App Checks**:
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Has a `<meta name="viewport">` tag
- ✅ Contains theme color meta tag
- ✅ Has a valid `manifest.json`
- ✅ Manifest has name and short_name
- ✅ Manifest has icons (192x192, 512x512)
- ✅ Manifest display is standalone/fullscreen/minimal-ui
- ✅ Content sized correctly for viewport
- ✅ Splash screen configured
- ✅ Address bar matches brand colors

**Optional Enhancements**:
- ⚠️ Installable (requires user engagement)
- ⚠️ Fast page load (3G network)
- ⚠️ Redirects HTTP to HTTPS (production only)

---

## 🧪 Automated Testing Script

Save as `test-pwa.js`:

```javascript
#!/usr/bin/env node

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await page.newPage();
  
  // Test 1: Service Worker
  await page.goto('http://localhost:8080');
  const swRegistered = await page.evaluate(() => {
    return navigator.serviceWorker.getRegistration()
      .then(reg => !!reg);
  });
  console.log('✅ Service Worker:', swRegistered ? 'PASS' : 'FAIL');
  
  // Test 2: Manifest
  const manifest = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]');
    return fetch(link.href).then(r => r.json());
  });
  console.log('✅ Manifest loaded:', manifest.name);
  
  // Test 3: Offline
  await page.setOfflineMode(true);
  await page.reload();
  const offlineWorks = await page.evaluate(() => {
    return document.body.innerHTML.length > 0;
  });
  console.log('✅ Offline mode:', offlineWorks ? 'PASS' : 'FAIL');
  
  await browser.close();
})();
```

---

## 📊 Production Deployment Checklist

Before deploying to production:

### Firebase
- [ ] Apply security rules in Firebase Console
- [ ] Test rules with authenticated and unauthenticated users
- [ ] Enable Firestore indexes if needed
- [ ] Review Firebase usage quotas

### PWA
- [ ] Run `npm run build:web`
- [ ] Run Lighthouse audit (score 90+)
- [ ] Test service worker registration
- [ ] Test offline mode
- [ ] Test installation on 3+ devices/browsers
- [ ] Verify manifest.json accessible
- [ ] Check all icons load correctly

### Security
- [ ] HTTPS enabled (required for PWA)
- [ ] Content Security Policy headers
- [ ] No exposed API keys in client code
- [ ] Firebase security rules applied
- [ ] Authentication working correctly

### Performance
- [ ] Static files cached (service worker)
- [ ] Images optimized
- [ ] Bundle size reasonable (<2MB)
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3s

### Cross-Browser Testing
- [ ] Chrome Desktop (install, offline)
- [ ] Edge Desktop (install, offline)
- [ ] Safari iOS (add to home screen)
- [ ] Chrome Android (add to home screen)
- [ ] Firefox (service worker, offline)

---

## 🎉 Success Criteria

Your PWA is ready when:

1. ✅ **Installable**
   - Install prompt appears on Chrome
   - "Add to Home Screen" works on mobile
   - App launches in standalone window

2. ✅ **Offline**
   - App loads without internet (after first visit)
   - Service worker caches essential files
   - Cached pages navigate correctly

3. ✅ **Secure**
   - Firebase auth persists across sessions
   - Firestore rules block unauthorized access
   - HTTPS enabled in production

4. ✅ **Fast**
   - Lighthouse Performance score 90+
   - First load <3 seconds
   - Subsequent loads <1 second (cached)

5. ✅ **Cross-Platform**
   - Works on iOS, Android, Desktop
   - Consistent experience across devices
   - Responsive design adapts to screen size

---

## 🚀 Deploy Commands

### Vercel
```bash
npm install -g vercel
npm run build:web
cd dist
vercel --prod
```

### Netlify
```bash
npm install -g netlify-cli
npm run build:web
netlify deploy --dir=dist --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
npm run build:web
firebase deploy --only hosting
```

---

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PWA Builder](https://www.pwabuilder.com/)
- [Can I Use - Service Workers](https://caniuse.com/serviceworkers)

---

**All tests passing? You're ready to deploy! 🎉**
