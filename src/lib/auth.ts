import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getAuthClient, hasFirebaseConfig } from './firebase'

export function canUseAuth(): boolean {
  return hasFirebaseConfig()
}

export function subscribeAuth(cb: (user: User | null) => void): () => void {
  if (!canUseAuth()) {
    cb(null)
    return () => {}
  }
  const auth = getAuthClient()
  return onAuthStateChanged(auth, cb)
}

export async function signInAnonymouslyIfNeeded(): Promise<User | null> {
  if (!canUseAuth()) return null
  const auth = getAuthClient()
  if (auth.currentUser) return auth.currentUser
  try {
    const cred = await signInAnonymously(auth)
    return cred.user
  } catch {
    return null
  }
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getAuthClient()
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

export async function signOut(): Promise<void> {
  if (!canUseAuth()) return
  await firebaseSignOut(getAuthClient())
}
