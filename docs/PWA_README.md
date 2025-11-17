# Progressive Web App (PWA) Setup

## 🎉 Your Expo App is now a PWA!

This app has been successfully configured as a Progressive Web App with offline support, installability, and native-like experience.

## ✅ What's Included

### PWA Manifest (`public/manifest.json`)
- App name, icons, theme colors
- Standalone display mode
- Portrait orientation
- 192x192 and 512x512 icons for all devices

### Service Worker (`public/service-worker.js`)
- **Offline caching** - App works without internet
- **Cache-first strategy** - Fast loading from cache
- **Background sync** - Ready for offline match submission
- **Push notifications** - Framework ready (optional)

### PWA Meta Tags
Automatically injected into all HTML files:
- Mobile web app capable
- Apple touch icons
- Theme colors for Android/iOS
- Service worker registration

### Build Scripts
- `npm run build:web` - Build and inject PWA features
- `npm run serve:web` - Test PWA locally

## 🚀 Testing Your PWA

### Local Testing
```bash
npm run build:web
npm run serve:web
```

Visit http://localhost:8080 and:

1. **Chrome Desktop**: Click install icon in address bar (⊕)
2. **Chrome Mobile**: "Add to Home Screen" in menu
3. **Safari iOS**: Share → "Add to Home Screen"
4. **Edge**: Click install icon or menu → "Apps" → "Install"

### DevTools Testing
Open Chrome DevTools → Application tab:
- **Manifest**: Verify all fields correct
- **Service Workers**: Should show "activated and running"
- **Cache Storage**: Check cached resources
- **Lighthouse**: Run PWA audit (should score 90+)

## 📱 Installation Experience

### Desktop
- Installs as standalone app
- Appears in Applications folder
- Own window without browser chrome
- Accessible from Start Menu/Dock

### Mobile
- Icon on home screen
- Splash screen on launch
- Full-screen mode
- Feels like native app

## 🔧 Customization

### Update Icons
Replace icons in `public/icons/`:
- `icon-192.png` - Android, PWA install badge
- `icon-512.png` - Splash screens, high-res displays

Or regenerate from source:
```bash
sips -z 192 192 assets/images/icon.png --out public/icons/icon-192.png
sips -z 512 512 assets/images/icon.png --out public/icons/icon-512.png
```

### Update Theme Colors
Edit `public/manifest.json`:
```json
{
  "theme_color": "#0066CC",  // Address bar color
  "background_color": "#ffffff"  // Splash screen background
}
```

Also update in `app.json` → `web` → `themeColor`

### Update App Name
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name"
}
```

### Service Worker Cache
Edit `public/service-worker.js`:
```js
const CACHE_NAME = 'pingpong-elo-v2';  // Bump version
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add more routes to cache
];
```

## 🌐 Deployment

### Vercel/Netlify
PWA features work automatically:
```bash
npm run build:web
# Deploy dist/ folder
```

### Custom Server
Serve the `dist/` folder with:
- HTTPS (required for service workers)
- Correct MIME types:
  - `manifest.json` → `application/manifest+json`
  - `.js` → `application/javascript`

### Firebase Hosting
```bash
npm run build:web
firebase deploy --only hosting
```

## 🔍 Troubleshooting

### Service Worker Not Registering
- **Check HTTPS**: Service workers require HTTPS (localhost is OK)
- **Check Console**: Look for registration errors
- **Clear Cache**: DevTools → Application → Clear Storage

### Manifest Not Loading
- **Check Path**: Must be `/manifest.json` from root
- **Check CORS**: Manifest must be same-origin
- **Validate JSON**: Use [Web App Manifest Validator](https://manifest-validator.appspot.com/)

### Icons Not Showing
- **Check Paths**: Icons must be accessible at `/icons/*`
- **Check Sizes**: 192x192 and 512x512 are required
- **Check Format**: Must be PNG

### "Add to Home Screen" Not Appearing
PWA install requires:
- ✅ Valid manifest with name, icons, start_url
- ✅ Service worker registered
- ✅ HTTPS (or localhost)
- ✅ User engagement (some browsers require visits)

## 📊 PWA Features Status

| Feature | Status | Notes |
|---------|--------|-------|
| Manifest | ✅ | Complete with icons |
| Service Worker | ✅ | Offline caching enabled |
| Offline Mode | ✅ | Cache-first strategy |
| Installable | ✅ | Desktop & mobile |
| Push Notifications | 🟡 | Framework ready, needs backend |
| Background Sync | 🟡 | Framework ready, needs implementation |
| App Shell | ✅ | Static HTML cached |
| Responsive | ✅ | Mobile-first design |
| HTTPS | ⚠️ | Required for production |

## 🎯 Next Steps

### Enhanced Offline Support
Implement offline match submission:
1. Store matches in IndexedDB when offline
2. Use Background Sync API to sync when online
3. Show offline indicator in UI

### Push Notifications
Set up Firebase Cloud Messaging:
1. Add FCM to service worker
2. Request notification permissions
3. Send notifications for match requests

### Advanced Caching
Implement smart caching strategies:
- Runtime caching for API responses
- Stale-while-revalidate for images
- Cache expiration policies

### Analytics
Track PWA-specific metrics:
- Installation rate
- Offline usage
- Service worker performance

## 📚 Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)

## 🐛 Known Issues

1. **iOS Safari**: Add to Home Screen requires manual action (no install prompt)
2. **Service Worker**: Must be served from root path `/service-worker.js`
3. **Caching**: First load requires network, subsequent loads work offline

---

**Your app is now a fully functional Progressive Web App! 🎉**

Test it, customize it, deploy it!
