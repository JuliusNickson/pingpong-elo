import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  apiKey: "AIzaSyAzrDs2naYANQ3R_HEeZbOvbLOPe2Wp4c0",
  authDomain: "pingpong-elo-27d40.firebaseapp.com",
  projectId: "pingpong-elo-27d40",
  storageBucket: "pingpong-elo-27d40.firebasestorage.app",
  messagingSenderId: "856486676652",
  appId: "1:856486676652:web:57b097fd0a216f66e0f709",
  measurementId: "G-ECRMVEZ757"
};

// Initialize Firebase
let app;
let db;
let auth;

export function initFirebase() {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      
      // Initialize Auth with persistence
      try {
        if (Platform.OS === 'web') {
          auth = getAuth(app);
        } else {
          // For React Native, use AsyncStorage for auth persistence
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
        }
      } catch (authError) {
        console.error('Auth initialization error:', authError);
        // Fallback: try getAuth for React Native too
        auth = getAuth(app);
      }
      
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

export function getFirebaseAuth() {
  if (!auth) {
    initFirebase();
  }
  return auth;
}

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

/**
 * Firestore Security Rules
 * 
 * Copy these rules to your Firebase Console > Firestore Database > Rules:
 * 
 * TEMPORARY DEV RULES (allows authenticated users to update any profile)
 * TODO: Implement Cloud Functions for proper server-side match processing
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // TEMPORARY: Allow authenticated users to read/write profiles
 *     // Needed because match acceptance updates both players' profiles
 *     match /users/{uid} {
 *       allow read: if request.auth != null;
 *       allow create, update: if request.auth != null;
 *       allow delete: if false;
 *     }
 *     
 *     // Match requests: authenticated users can read/write
 *     match /matchRequests/{requestId} {
 *       allow read, write: if request.auth != null;
 *     }
 *     
 *     // Matches: authenticated users can create, everyone can read
 *     match /matches/{matchId} {
 *       allow read: if request.auth != null;
 *       allow create: if request.auth != null;
 *       allow update, delete: if false;
 *     }
 *   }
 * }
 */
