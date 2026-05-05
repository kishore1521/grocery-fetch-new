import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isGuest: boolean
  isLoading: boolean
  setSession: (session: Session | null) => void
  setGuest: (isGuest: boolean) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isGuest: false,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setGuest: (isGuest) => set({ isGuest }),
  setLoading: (isLoading) => set({ isLoading }),
}))
