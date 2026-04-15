import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: 'AIzaSyBTmu8jPXAqAEjkKn9ZCWYLWjd8CAc2y2U',
    authDomain: 'tabs-74415.firebaseapp.com',
    projectId: 'tabs-74415',
    storageBucket: 'tabs-74415.firebasestorage.app',
    messagingSenderId: '797921172338',
    // ⚠️  Replace with your Web App ID from Firebase console (see instructions above)
    appId: '1:797921172338:web:7934fbee1a6c78b013dbeb',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)