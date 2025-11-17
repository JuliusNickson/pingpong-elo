# 🔐 Firebase Security Setup Guide

## Current Status

✅ **Firebase Authentication**: Configured with browser local persistence  
✅ **Firestore Database**: IndexedDB persistence enabled for offline  
✅ **Security Rules**: Ready to deploy (see below)  
⚠️ **Action Required**: Apply security rules in Firebase Console

## Step 1: Apply Firestore Security Rules

### Option A: Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/project/pingpong-elo-27d40/firestore/rules)
2. Click on **Firestore Database** → **Rules**
3. Copy the contents of `firestore.rules` file
4. Paste into the rules editor
5. Click **Publish**

### Option B: Firebase CLI

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## Step 2: Verify Security Rules

After deploying, test the rules:

### Test 1: Unauthenticated Access (Should Fail)
```javascript
// Open browser console on http://localhost:8080
// Before logging in, try:
const db = firebase.firestore();
db.collection('users').get()
  .then(snap => console.log('SUCCESS (BAD!)'))
  .catch(err => console.log('BLOCKED (GOOD!)', err));
```

### Test 2: Authenticated Access (Should Work)
```javascript
// After logging in:
const db = firebase.firestore();
db.collection('users').get()
  .then(snap => console.log('SUCCESS (GOOD!)', snap.size, 'users'))
  .catch(err => console.log('BLOCKED (BAD!)', err));
```

## Current Security Rules

Your Firestore is protected with these rules:

### User Profiles (`/users/{uid}`)
- ✅ **Read**: Any authenticated user (for leaderboard)
- ✅ **Create**: User can create their own profile
- ⚠️ **Update**: Any authenticated user (TEMPORARY - needed for match acceptance)
- ❌ **Delete**: Nobody can delete profiles

### Match Requests (`/matchRequests/{requestId}`)
- ✅ **Read**: Any authenticated user
- ✅ **Create**: Only if you're the requester
- ✅ **Update**: Only if you're the requester or opponent
- ✅ **Delete**: Only if you're the requester or opponent

### Matches (`/matches/{matchId}`)
- ✅ **Read**: Any authenticated user
- ✅ **Create**: Only if you're one of the players
- ❌ **Update**: Immutable (matches can't be changed)
- ❌ **Delete**: Immutable (matches can't be deleted)

## Security Improvements for Production

### 🔒 Current Limitation
Any authenticated user can update any profile. This is needed because when Player A accepts a match request from Player B, both players' ratings need to be updated.

### ✅ Production Solution
Implement Cloud Functions for match processing:

```javascript
// functions/src/index.js
exports.acceptMatchRequest = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }
  
  const { requestId } = data;
  const db = admin.firestore();
  
  return db.runTransaction(async (transaction) => {
    // Get request
    const requestRef = db.collection('matchRequests').doc(requestId);
    const request = await transaction.get(requestRef);
    
    // Verify user is the opponent
    if (request.data().opponentUid !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }
    
    // Calculate new ratings
    const newRatings = calculateElo(/* ... */);
    
    // Update both profiles atomically
    transaction.update(winnerProfileRef, { rating: newRatings.winner });
    transaction.update(loserProfileRef, { rating: newRatings.loser });
    
    // Create match record
    transaction.set(matchRef, { /* ... */ });
    
    // Delete request
    transaction.delete(requestRef);
  });
});
```

Then update security rules:
```javascript
match /users/{uid} {
  // Only allow self-updates
  allow update: if request.auth.uid == uid;
}
```

## Firebase Configuration Files

### `firebase.json` (Optional)
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Testing Checklist

Before deploying to production:

- [ ] Apply security rules in Firebase Console
- [ ] Test unauthenticated access is blocked
- [ ] Test authenticated users can read leaderboard
- [ ] Test users can create their own profile
- [ ] Test users can send match requests
- [ ] Test users can accept/decline requests
- [ ] Test match history is recorded correctly
- [ ] Test users stay logged in after page refresh
- [ ] Test offline mode works (disconnect internet)
- [ ] Review Firebase Console > Authentication for active users

## Monitoring & Debugging

### Firebase Console Tabs

1. **Authentication** → Active users, sign-in methods
2. **Firestore Database** → Data, rules, indexes, usage
3. **Hosting** → Deploy history, domains, performance
4. **Functions** → Cloud functions (if using)
5. **Performance** → Load times, network requests
6. **Analytics** → User engagement, retention

### Useful Firestore Queries

```javascript
// Get top 10 players
db.collection('users')
  .orderBy('rating', 'desc')
  .limit(10)
  .get();

// Get pending requests for a user
db.collection('matchRequests')
  .where('opponentUid', '==', userId)
  .where('status', '==', 'pending')
  .get();

// Get recent matches
db.collection('matches')
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get();
```

## Cost Estimation

Firebase Spark (Free) Plan includes:
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ 1GB storage
- ✅ 10GB bandwidth/month

Your app usage estimate:
- 100 active users/day
- 20 matches/day = ~200 reads + 100 writes
- Well within free tier! 🎉

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/project/pingpong-elo-27d40)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)

---

**Next Step**: Apply the security rules in Firebase Console and test! 🚀
