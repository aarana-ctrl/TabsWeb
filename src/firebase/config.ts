// Firebase Web SDK config.
// Project: tabs-74415 — same Firestore database as the iOS app.
//
// HOW TO GET YOUR WEB APP ID:
//  1. Go to https://console.firebase.google.com → Project tabs-74415
//  2. Project Settings (gear icon) → "Your apps"
//  3. Click "Add app" → choose Web (</>)
//  4. Register the app and copy the firebaseConfig object
//  5. Replace the placeholder appId below with the value from the console.
//
// For Google Sign-In:
//  Firebase Console → Authentication → Sign-in method → Google → Enable
//  Add your domain (e.g. tabs-xxx.vercel.app) to Authorized domains.

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyBTmu8jPXAqAEjkKn9ZCWYLWjd8CAc2y2U',
  authDomain:        'tabs-74415.firebaseapp.com',
  projectId:         'tabs-74415',
  storageBucket:     'tabs-74415.firebasestorage.app',
  messagingSenderId: '797921172338',
  // ⚠️  Replace with your Web App ID from Firebase console (see instructions above)
  appId:             '1:797921172338:web:7934fbee1a6c78b013dbeb',
}

export const app  = initializeApp(firebaseConfig)
export const db   = getFirestore(app)
export const auth = getAuth(app)
