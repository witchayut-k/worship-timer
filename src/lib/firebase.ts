import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as
    | string
    | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as
    | string
    | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every(Boolean)
}

function missingKeys(): string[] {
  return Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k)
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null

export function getFirebaseApp(): FirebaseApp {
  if (_app) return _app
  if (!hasFirebaseConfig()) {
    throw new Error(
      `Missing Firebase config env vars: ${missingKeys().join(', ')}. Copy .env.example to .env.local and fill values.`,
    )
  }
  _app = initializeApp(firebaseConfig)
  return _app
}

export function getAuthClient(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  return _auth
}

export function getDb(): Firestore {
  if (_db) return _db
  _db = getFirestore(getFirebaseApp())
  return _db
}

