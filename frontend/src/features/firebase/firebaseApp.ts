import { initializeApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function createFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    return null;
  }

  return initializeApp(firebaseConfig);
}
