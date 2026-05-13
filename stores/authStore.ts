import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import i18n from '../lib/i18n'

interface AuthState {
  session: Session | null
  user: User | null
  isGuest: boolean
  isLoading: boolean
  language: string
  setSession: (session: Session | null) => void
  setGuest: (isGuest: boolean) => void
  setLoading: (loading: boolean) => void
  setLanguage: (language: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isGuest: false,
  isLoading: true,
  language: 'en',
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setGuest: (isGuest) => set({ isGuest }),
  setLoading: (isLoading) => set({ isLoading }),
  setLanguage: (language) => {
    i18n.changeLanguage(language)
    set({ language })
  },
}))
