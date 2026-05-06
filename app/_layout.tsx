import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '../constants/colors'

const checkOnboarding = async (userId: string) => {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('zip_code')
      .eq('user_id', userId)
      .single()

    if (data?.zip_code) {
      router.replace('/(tabs)/')
    } else {
      router.replace('/onboarding/step1-zip')
    }
  } catch {
    // On error, send to tabs — better than being stuck on a spinner
    router.replace('/(tabs)/')
  }
}

export default function RootLayout() {
  const { session, isLoading, isGuest, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoading) return
    if (session) {
      checkOnboarding(session.user.id)
    } else if (!isGuest) {
      // isGuest = true means login screen already routed to onboarding — don't override
      router.replace('/auth/login')
    }
  }, [session, isLoading, isGuest])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
