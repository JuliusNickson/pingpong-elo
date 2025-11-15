# Ping Pong ELO Tracker with Firebase Sync

A React Native app for tracking ping pong player rankings using the ELO rating system with real-time Firebase Firestore synchronization.

## Features

- 📊 **ELO Rating System** - Automatic rating calculations (K-factor: 32, Default: 1000)
- 🏆 **Leaderboard** - Live rankings with wins/losses stats
- 👥 **Player Management** - Add/remove players
- 🏓 **Match Recording** - Track match results with rating changes
- 📜 **Match History** - View past matches with ELO adjustments
- ☁️ **Firebase Firestore Sync** - Real-time data synchronization across devices
- 📱 **Offline Support** - Works offline with automatic sync queue
- 💾 **Hybrid Storage** - SQLite for native (iOS/Android), AsyncStorage for web

## Architecture

```
┌─────────────────────────┐
│   Firebase Firestore    │ ← Global cloud database
│  (Players & Matches)    │
└────────────┬────────────┘
             │ Real-time sync
             │
┌────────────▼─────────────────────────┐
│      React Native App                │
│  ┌──────────────────────────────┐   │
│  │     LOCAL STORAGE            │   │
│  │  - SQLite (iOS/Android)      │   │
│  │  - AsyncStorage (Web)        │   │
│  │  - Offline queue             │   │
│  │  - Local cache               │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd pingpong-elo
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add a **Web App** to your project
4. Copy your Firebase configuration

5. Edit `utils/firebase.js` and replace the config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in production mode**
4. Select a location

### 4. Configure Firestore Security Rules

Go to **Firestore Database > Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players collection
    match /players/{playerId} {
      allow read: if true;
      allow write: if true; // For development - add auth for production!
    }
    
    // Matches collection
    match /matches/{matchId} {
      allow read: if true;
      allow write: if true; // For development - add auth for production!
    }
  }
}
```

**⚠️ Important:** These rules allow anyone to read/write. For production, implement proper authentication!

### 5. Enable Firestore Indexes (Optional)

For better query performance, create these indexes in **Firestore Database > Indexes**:

- Collection: `players` | Fields: `rating` (Descending), `__name__` (Ascending)
- Collection: `matches` | Fields: `timestamp` (Descending), `__name__` (Ascending)

### 6. Run the App

```bash
# Start Expo development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android

# Run on Web
npx expo start --web
```

## Firestore Data Structure

### Players Collection

```javascript
/players/{playerId}
{
  id: "uid123",
  name: "Niki",
  rating: 1040,
  matchesPlayed: 14,
  updatedAt: Timestamp
}
```

### Matches Collection

```javascript
/matches/{matchId}
{
  id: "match123",
  playerA: "uid1",
  playerB: "uid2",
  winner: "uid2",
  timestamp: 1737272000,
  ratingA_before: 1000,
  ratingA_after: 984,
  ratingB_before: 1050,
  ratingB_after: 1066,
  createdAt: Timestamp
}
```

## How Sync Works

### Real-Time Sync Flow

1. **User adds player/match** → Saved to local storage immediately
2. **Sync manager attempts Firebase sync** → If successful, marks as synced
3. **If offline/fails** → Adds to sync queue
4. **Firebase listeners active** → Receives updates from other devices in real-time
5. **On reconnect** → Sync queue processes automatically

### Offline Mode

- ✅ All features work offline
- ✅ Data saved to local SQLite/AsyncStorage
- ✅ Pending changes queued for sync
- ✅ Visual indicator shows pending items
- ✅ Manual sync trigger available

### Sync Status Component

The app displays sync status at the top:
- **☁️ Synced** - All data in sync
- **⏱️ N pending** - Items waiting to sync
- **📱 Offline Mode** - Firebase not configured
- **Syncing...** - Sync in progress

## Project Structure

```
pingpong-elo/
├── app/
│   ├── _layout.js           # Root navigation layout
│   ├── index.js             # Leaderboard screen
│   ├── players.js           # Player management
│   ├── add-match.js         # Match recording
│   ├── history.js           # Match history
│   └── settings.js          # Settings & sync status
├── components/
│   ├── PlayerCard.js        # Leaderboard item
│   ├── MatchItem.js         # History item
│   ├── Button.js            # Reusable button
│   └── SyncStatus.js        # Firebase sync indicator
├── hooks/
│   ├── usePlayers.js        # Player state + real-time sync
│   └── useMatches.js        # Match state + real-time sync
├── utils/
│   ├── firebase.js          # Firebase initialization
│   ├── sync.js              # Sync manager (Firestore ↔ Local)
│   ├── database.js          # SQLite setup (native only)
│   ├── storage.js           # CRUD operations
│   └── elo.js               # ELO calculation
└── constants/
    ├── colors.js            # Color palette
    └── defaults.js          # ELO defaults
```

## Tech Stack

- **Framework:** Expo SDK 54 + React Native 0.81.5
- **Navigation:** Expo Router (file-based)
- **Database:** 
  - SQLite (expo-sqlite) for iOS/Android
  - AsyncStorage for web
- **Cloud Sync:** Firebase Firestore
- **State Management:** React hooks

## ELO System

### Formula

```
Expected Score = 1 / (1 + 10^((Opponent ELO - Player ELO) / 400))
New ELO = Old ELO + K × (Actual Score - Expected Score)
```

### Constants

- **Default ELO:** 1000
- **K-Factor:** 32 (higher = more volatile ratings)
- **Min ELO:** 100
- **Max ELO:** 3000

## Development

### Running Without Firebase

The app works fully offline without Firebase configuration. Simply skip the Firebase setup steps and the app will:
- Display "📱 Offline Mode" indicator
- Store all data locally only
- Disable sync features

### Adding Authentication (Production)

For production, implement Firebase Authentication:

1. Enable authentication in Firebase Console
2. Update Firestore rules:
```javascript
allow write: if request.auth != null;
```
3. Add auth flow to app
4. Update sync.js to include user context

### Debugging Sync

Check logs for sync events:
- `"Database initialized successfully"` - SQLite ready
- `"Firebase initialized successfully"` - Firestore connected
- `"Sync manager initialized"` - Real-time listeners active
- `"Added to sync queue"` - Offline item queued
- `"Processing N items in sync queue"` - Sync in progress

## Troubleshooting

### Firebase Not Syncing

1. Check Firebase config in `utils/firebase.js`
2. Verify Firestore rules allow writes
3. Check network connection
4. Look for errors in terminal
5. Try manual sync from Settings screen

### SQLite Errors on Native

1. Delete app from device/simulator
2. Clear Expo cache: `npx expo start -c`
3. Reinstall: `npm install`

### Web Platform Issues

- Web uses AsyncStorage (Firebase only, no SQLite)
- Clear browser localStorage to reset data
- Check browser console for errors

## License

MIT

## Credits

Built with ❤️ using Expo and Firebase
