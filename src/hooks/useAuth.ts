import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { canUseAuth, signInAnonymouslyIfNeeded, signInWithGoogle, signOut, subscribeAuth } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!canUseAuth())

  useEffect(() => {
    if (!canUseAuth()) {
      setUser(null)
      setReady(true)
      return
    }
    let cancelled = false
    const unsub = subscribeAuth((u) => {
      if (cancelled) return
      setUser(u)
      setReady(true)
    })
    if (!user) {
      void signInAnonymouslyIfNeeded().catch(() => {})
    }
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  return {
    user,
    uid: user?.uid ?? null,
    ready,
    canUseAuth: canUseAuth(),
    signIn: signInWithGoogle,
    signOut,
  }
}
