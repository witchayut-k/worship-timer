import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import { canUseAuth, signInWithGoogle, signOut, subscribeAuth } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!canUseAuth())

  useEffect(() => {
    if (!canUseAuth()) {
      setUser(null)
      setReady(true)
      return
    }
    return subscribeAuth((u) => {
      setUser(u)
      setReady(true)
    })
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
