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
    void (async () => {
      const anonUser = await signInAnonymouslyIfNeeded()
      if (cancelled) return
      if (anonUser) {
        setUser(anonUser)
        setReady(true)
      }
    })()
    const unsub = subscribeAuth((u) => {
      if (cancelled) return
      setUser(u)
      if (u) setReady(true)
    })
    const authTimeout = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 8000)
    return () => {
      cancelled = true
      window.clearTimeout(authTimeout)
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
