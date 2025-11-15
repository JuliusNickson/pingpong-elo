import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { Platform } from 'react-native';

/**
 * Firebase Configuration
 * 
 * To set up Firebase:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Add a web app to your project
 * 4. Copy the configuration object below
 * 5. Enable Firestore Database in the Firebase console
 * 6. Set up security rules (see bottom of file)
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let db;

export function initFirebase() {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      
      // Enable offline persistence for web
      if (Platform.OS === 'web') {
        enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled in first tab only');
          } else if (err.code === 'unimplemented') {
            console.warn('Browser doesn\'t support persistence');
          }
        });
      }
      
      console.log('Firebase initialized successfully');
    }
    return db;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
}

export function getFirestoreDb() {
  if (!db) {
    return initFirebase();
  }
  return db;
}

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

/**
 * Firestore Security Rules
 * 
 * Copy these rules to your Firebase Console > Firestore Database > Rules:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Players collection - anyone can read, only authenticated can write
 *     match /players/{playerId} {
 *       allow read: if true;
 *       allow write: if request.auth != null || true; // Set to true for no-auth development
 *     }
 *     
 *     // Matches collection - anyone can read, only authenticated can write
 *     match /matches/{matchId} {
 *       allow read: if true;
 *       allow write: if request.auth != null || true; // Set to true for no-auth development
 *     }
 *   }
 * }
 * 
 * NOTE: For production, implement proper authentication!
 * The rules above are permissive for development purposes.
 */
