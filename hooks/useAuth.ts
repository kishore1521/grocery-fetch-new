import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { session, user, isGuest, isLoading } = useAuthStore()

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return { session, user, isGuest, isLoading, signOut }
}
