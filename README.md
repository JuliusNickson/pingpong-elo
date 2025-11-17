# Pingpong ELO Tracker 🏓

A Progressive Web App (PWA) for tracking ping pong matches and ELO ratings with Firebase backend.

## 🚀 Quick Start

### Development
```bash
npm install
npx expo start
```

### Production (PWA)
```bash
npm run build:web
firebase deploy --only hosting
```

**Live App:** https://pingpong-elo-27d40.web.app

## 📱 Features

- ⚡ **Progressive Web App** - Install on any device
- 🔐 **Firebase Authentication** - Secure user login
- 📊 **ELO Rating System** - Track player rankings
- 🎮 **Match Requests** - Challenge other players
- 📜 **Match History** - View all past games
- 🏆 **Leaderboard** - See top players
- 📴 **Offline Support** - Works without internet

## 📚 Documentation

All documentation is in the [`docs/`](./docs/) folder:

- **[QUICKSTART_PWA.md](./docs/QUICKSTART_PWA.md)** - Quick PWA setup guide
- **[PWA_README.md](./docs/PWA_README.md)** - Complete PWA implementation details
- **[PWA_TESTING.md](./docs/PWA_TESTING.md)** - Testing guide for service worker and installation
- **[FIREBASE_SECURITY.md](./docs/FIREBASE_SECURITY.md)** - Firestore security rules setup
- **[FIREBASE_README.md](./docs/FIREBASE_README.md)** - Firebase integration guide
- **[INTEGRATION_SUMMARY.md](./docs/INTEGRATION_SUMMARY.md)** - Architecture overview
- **[PHASE3_4_COMPLETE.md](./docs/PHASE3_4_COMPLETE.md)** - PWA transformation phases

## 🛠 Tech Stack

- **Frontend:** React Native + Expo Router
- **Backend:** Firebase (Auth + Firestore)
- **Deployment:** Firebase Hosting
- **PWA:** Service Worker + Web Manifest

## 📦 Project Structure

```
pingpong-elo/
├── app/              # Expo Router pages
├── components/       # React components
├── contexts/         # React Context (Auth)
├── hooks/            # Custom hooks
├── utils/            # Firebase & helper functions
├── constants/        # Colors, styles
├── scripts/          # Build scripts (PWA injection)
├── docs/             # All documentation
└── dist/             # Built PWA (generated)
```

## 🔧 Development

This project uses Expo Router for file-based routing. Edit files in the `app/` directory to modify screens.

## 🌐 Deployment

Deploy updates with:
```bash
npm run build:web && firebase deploy --only hosting
```

Your changes will be live at https://pingpong-elo-27d40.web.app within seconds.

## 📄 License

MIT
