import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4mx9u8dMMuElPNR5GpjrhaHH2aShNzGs",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "team-asterix-website.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "team-asterix-website",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "team-asterix-website.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "108263527930",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:108263527930:web:12c0c76ce38afc88d08043"
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.includes('AIzaSy...') &&
    !firebaseConfig.projectId.includes('your-project-id')
);

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isFirebaseConfigured) {
    try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        try {
            storage = getStorage(app);
        } catch {
            storage = null;
        }
        console.log('⚡ Firebase connected successfully (Firestore & Auth active).');
    } catch (err) {
        console.error('Failed to initialize Firebase:', err);
    }
} else {
    console.info('ℹ️ Firebase keys not configured. Running in offline/localStorage mode.');
}

export { app, db, auth, storage };
