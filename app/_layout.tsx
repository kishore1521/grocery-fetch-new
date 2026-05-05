import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { View, ActivityIndicator } from 'react-native'
import { colors } from '../constants/colors'

export default function RootLayout() {
  const { session, isLoading, setSession, setLoading } = useAuthStore()

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
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (session) {
      router.replace('/(tabs)/')
    } else {
      router.replace('/auth/login')
    }
  }, [session, isLoading])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
