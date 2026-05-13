import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence is only available in the native bundle, which TS may not resolve correctly
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase
const isAppInitialized = getApps().length > 0;
const app: FirebaseApp = !isAppInitialized ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
// We use try/catch blocks to handle HMR re-initialization in development
let firebaseAuth: Auth;
if (isAppInitialized) {
  firebaseAuth = getAuth(app);
} else {
  try {
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error) {
    firebaseAuth = getAuth(app);
  }
}

let firestoreDb: Firestore;
if (isAppInitialized) {
  firestoreDb = getFirestore(app);
} else {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache({})
    });
  } catch (error) {
    firestoreDb = getFirestore(app);
  }
}

export const auth = firebaseAuth;
export const db = firestoreDb;

export default app;
