
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// --- CONFIGURATION START ---
// Paste your firebaseConfig object here if you are not using a .env file.
// It should look like: const manualConfig = { apiKey: "...", ... };
const manualConfig: any = {
  apiKey: "AIzaSyCNVruQBVbE3oLVcDX6yvn9YnC7phO3R9M",
  authDomain: "apex-trader-ba1e1.firebaseapp.com",
  projectId: "apex-trader-ba1e1",
  storageBucket: "apex-trader-ba1e1.firebasestorage.app",
  messagingSenderId: "575788712704",
  appId: "1:575788712704:web:9620d1f3865accff0029e5",
  measurementId: "G-S7G2KB2WNE"
};
// --- CONFIGURATION END ---

// Cast import.meta to any to avoid TypeScript errors
const env = (import.meta as any).env || {};

// Determine which config to use: Manual takes precedence over Environment Variables
const apiKey = manualConfig.apiKey || env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: manualConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: manualConfig.projectId || env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: manualConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: manualConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: manualConfig.appId || env.VITE_FIREBASE_APP_ID,
  measurementId: manualConfig.measurementId || env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if config is present
let app = null;
let authInstance = null;
let analyticsInstance = null;

if (apiKey) {
  try {
    // Check if firebase app is already initialized to avoid "Duplicate App" errors in HMR
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    
    // Pass 'app' instance explicitly to getAuth to ensure correct dependency resolution
    if (app) {
        try {
            authInstance = getAuth(app);
            if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
               analyticsInstance = getAnalytics(app);
            }
        } catch (authError) {
            console.error("Firebase Auth initialization failed. This is often due to module loading mismatch.", authError);
        }
    }
  } catch (e) {
    console.error("Firebase App initialization error:", e);
  }
} else {
  console.warn("Firebase configuration missing. Authentication will be disabled.");
}

export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const analytics = analyticsInstance;
