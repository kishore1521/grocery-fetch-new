import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'

export default function OnboardingComplete() {
  const { isGuest } = useAuthStore()
  const [firstName, setFirstName] = useState('Shopper')

  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fetch first name
    if (!isGuest) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        const name = user?.user_metadata?.first_name as string | undefined
        if (name) setFirstName(name)
      })
    }

    // Animate checkmark in
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: 150,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start()

    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start()

    // Auto-navigate after 2500ms
    const timer = setTimeout(() => {
      router.replace('/(tabs)/')
    }, 2500)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LinearGradient
      colors={['#051F20', '#163832']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <View style={styles.content}>
        {/* Animated checkmark circle */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkText}>✓</Text>
        </Animated.View>

        {/* Text content */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.heading}>You're all set!</Text>
          <Text style={styles.subText}>
            {firstName}, let's find you the best prices{'\n'}on Long Island.
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#8EB69B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 36,
    color: '#8EB69B',
    lineHeight: 42,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15,
    color: 'rgba(218,241,222,0.8)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
})
