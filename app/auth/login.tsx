import { useState, useMemo, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Line, Circle, Polygon } from 'react-native-svg'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { colors } from '../../constants/colors'

const { height: screenHeight, width: screenWidth } = Dimensions.get('window')

// ─── Headlines ───────────────────────────────────────────────────────────────

const HEADLINES = [
  { main: 'Stop leaving money\nat the checkout.', sub: 'See where every item is cheapest.' },
  { main: 'The same milk.\nFour different prices.', sub: 'We track prices across every LI store.' },
  { main: 'Your neighbors\nare paying less.', sub: 'Find out exactly where and by how much.' },
  { main: 'Why pay more\ntwo miles away?', sub: 'Compare ShopRite, Stop & Shop, Aldi & more.' },
  { main: 'Your grocery bill\nhas been lying to you.', sub: 'See the real prices. Make smarter choices.' },
  { main: "Aldi's cheaper.\nWe'll show you by how much.", sub: 'Real-time prices for Long Island shoppers.' },
  { main: 'Know before\nyou go.', sub: 'The smartest way to shop on Long Island.' },
  { main: 'Your receipt\ntells a story.', sub: 'Scan it and find out if you got the best deal.' },
  { main: 'The price difference\nwill surprise you.', sub: 'Same product. Very different prices.' },
  { main: 'Long Island shops\nsmarter here.', sub: 'Join families saving money every week.' },
  { main: 'Stop guessing.\nStart saving.', sub: 'Real prices from real Long Island stores.' },
  { main: 'Your family deserves\nbetter prices.', sub: 'We find them before you shop.' },
  { main: 'Smarter shopping\nstarts here.', sub: "Long Island's grocery price comparison app." },
  { main: 'One app.\nEvery grocery price.', sub: 'ShopRite, Stop & Shop, Aldi, Walmart & more.' },
  { main: 'Save $20 on your\nnext grocery run.', sub: 'Long Island families already do.' },
]

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const STROKE = { stroke: 'white', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

const CartIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" {...STROKE} />
    <Line x1="3" y1="6" x2="21" y2="6" {...STROKE} />
    <Path d="M16 10a4 4 0 01-8 0" {...STROKE} />
  </Svg>
)

const TagIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" {...STROKE} />
    <Line x1="7" y1="7" x2="7.01" y2="7" {...STROKE} />
  </Svg>
)

const CircleIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="8" {...STROKE} />
    <Path d="M12 4 Q14 2 15 3" {...STROKE} />
  </Svg>
)

const BagIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" {...STROKE} />
    <Line x1="3" y1="6" x2="21" y2="6" {...STROKE} />
  </Svg>
)

const DollarIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line x1="12" y1="1" x2="12" y2="23" {...STROKE} />
    <Path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" {...STROKE} />
  </Svg>
)

const LeafIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M17 8C8 10 5.9 16.17 3.82 19.34a1 1 0 001.38.32C8.5 17.65 13 15 17 8z" {...STROKE} />
    <Path d="M17 8c0 0 2 8-4 12" {...STROKE} />
  </Svg>
)

const StarIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...STROKE} />
  </Svg>
)

const PercentIcon = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Line x1="19" y1="5" x2="5" y2="19" {...STROKE} />
    <Circle cx="6.5" cy="6.5" r="2.5" {...STROKE} />
    <Circle cx="17.5" cy="17.5" r="2.5" {...STROKE} />
  </Svg>
)

// ─── Floating Icon Data ───────────────────────────────────────────────────────

const FLOAT_DATA = [
  { Icon: CartIcon,    x: screenWidth * 0.08, size: 28, duration: 11000, delay: 0 },
  { Icon: TagIcon,     x: screenWidth * 0.20, size: 22, duration: 9000,  delay: 1500 },
  { Icon: CircleIcon,  x: screenWidth * 0.35, size: 26, duration: 12000, delay: 3000 },
  { Icon: BagIcon,     x: screenWidth * 0.48, size: 24, duration: 10000, delay: 500 },
  { Icon: DollarIcon,  x: screenWidth * 0.62, size: 20, duration: 8500,  delay: 2000 },
  { Icon: LeafIcon,    x: screenWidth * 0.75, size: 22, duration: 13000, delay: 4000 },
  { Icon: StarIcon,    x: screenWidth * 0.85, size: 18, duration: 9500,  delay: 1000 },
  { Icon: PercentIcon, x: screenWidth * 0.15, size: 20, duration: 11500, delay: 2500 },
  { Icon: CartIcon,    x: screenWidth * 0.55, size: 18, duration: 10500, delay: 3500 },
  { Icon: TagIcon,     x: screenWidth * 0.90, size: 16, duration: 8000,  delay: 5000 },
]

// ─── FloatingIcon Component ───────────────────────────────────────────────────

interface FloatingIconProps {
  children: React.ReactNode
  xPosition: number
  duration: number
  delay: number
}

function FloatingIcon({ children, xPosition, duration, delay }: FloatingIconProps) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let cancelled = false

    const run = () => {
      if (cancelled) return
      translateY.setValue(0)
      opacity.setValue(0)
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -screenHeight,
          duration,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: duration * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.18,
            duration: duration * 0.75,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.15,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished && !cancelled) run()
      })
    }

    const timer = setTimeout(run, delay)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: xPosition,
        bottom: 0,
        transform: [{ translateY }],
        opacity,
      }}
      pointerEvents="none"
    >
      {children}
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = 'signin' | 'signup'

export default function LoginScreen() {
  const { t } = useTranslation()
  const { setGuest } = useAuthStore()

  const headline = useMemo(
    () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
    []
  )

  const [activeTab, setActiveTab] = useState<Tab>('signin')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [firstNameFocused, setFirstNameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)

  // Headline entrance animation
  const headlineOpacity = useRef(new Animated.Value(0)).current
  const headlineY = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1, duration: 500, delay: 300, useNativeDriver: true,
      }),
      Animated.timing(headlineY, {
        toValue: 0, duration: 500, delay: 300, useNativeDriver: true,
      }),
    ]).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Button press scale
  const buttonScale = useRef(new Animated.Value(1)).current

  const onButtonPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 0 }).start()
  }
  const onButtonPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
  }

  const switchTab = (tab: Tab) => {
    setActiveTab(tab)
    setError(null)
    setSuccessMessage(null)
    setFirstNameError(null)
    setEmailError(null)
    setPasswordError(null)
  }

  const validateInputs = (): boolean => {
    let valid = true

    if (activeTab === 'signup') {
      if (firstName.trim().length < 2) {
        setFirstNameError(t('auth.firstNameError'))
        valid = false
      } else {
        setFirstNameError(null)
      }
    }

    if (!email.includes('@') || !email.includes('.')) {
      setEmailError(t('auth.emailError'))
      valid = false
    } else {
      setEmailError(null)
    }

    if (password.length < 6) {
      setPasswordError(t('auth.passwordError'))
      valid = false
    } else {
      setPasswordError(null)
    }

    return valid
  }

  const handleSignIn = async () => {
    if (!validateInputs()) return
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Navigation handled by _layout.tsx on session change
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (msg.includes('Invalid login credentials')) {
        setError(t('auth.invalidCredentials'))
      } else if (msg.includes('Email not confirmed')) {
        setError(t('auth.emailNotConfirmed'))
      } else {
        setError(t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!validateInputs()) return
    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName } },
      })
      if (error) throw error
      setSuccessMessage(t('auth.checkEmail'))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = () => {
    setGuest(true)
    router.replace('/onboarding/step1-language')
  }

  const handleSubmit = () => {
    if (activeTab === 'signin') handleSignIn()
    else handleSignUp()
  }

  return (
    <View style={styles.root}>

      {/* ── Layer 1a: Background gradient ── */}
      <LinearGradient
        colors={['#051F20', '#0B2B26', '#163832']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 1b: Floating grocery icons ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {FLOAT_DATA.map(({ Icon, x, size, duration, delay }, i) => (
          <FloatingIcon key={i} xPosition={x} duration={duration} delay={delay}>
            <Icon size={size} />
          </FloatingIcon>
        ))}
      </View>

      {/* ── Layer 2: Content ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top section: logo + location pill + headline */}
        <View style={styles.topSection}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <CartIcon size={22} />
            </View>
            <Text style={styles.appName}>Grocery Fetch</Text>
          </View>

          <View style={styles.locationPill}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText}>LONG ISLAND, NY</Text>
          </View>

          <Animated.View
            style={[
              styles.headlineArea,
              { opacity: headlineOpacity, transform: [{ translateY: headlineY }] },
            ]}
          >
            <Text style={styles.headlineMain}>{headline.main}</Text>
            <Text style={styles.headlineSub}>{headline.sub}</Text>
          </Animated.View>
        </View>

        {/* Bottom sheet */}
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.handleBar} />

          {/* Tab switcher */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
              onPress={() => switchTab('signin')}
            >
              <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
                {t('auth.signIn')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
              onPress={() => switchTab('signup')}
            >
              <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>
                {t('auth.signUp')}
              </Text>
            </Pressable>
          </View>

          {/* First Name — Sign Up only */}
          {activeTab === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('auth.firstName')}</Text>
              <TextInput
                style={[
                  styles.input,
                  firstNameFocused && styles.inputFocused,
                  firstNameError ? styles.inputError : null,
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('auth.firstNamePlaceholder')}
                placeholderTextColor="#8EB69B"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                onFocus={() => setFirstNameFocused(true)}
                onBlur={() => setFirstNameFocused(false)}
              />
              {firstNameError && <Text style={styles.fieldError}>{firstNameError}</Text>}
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.email')}</Text>
            <TextInput
              ref={emailRef}
              style={[
                styles.input,
                emailFocused && styles.inputFocused,
                emailError ? styles.inputError : null,
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="#8EB69B"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('auth.password')}</Text>
            <View>
              <TextInput
                ref={passwordRef}
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordFocused && styles.inputFocused,
                  passwordError ? styles.inputError : null,
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor="#8EB69B"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                style={styles.showHideButton}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.showHideText}>
                  {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                </Text>
              </Pressable>
            </View>
            {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
          </View>

          {/* General error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Success banner */}
          {successMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          )}

          {/* Primary button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }], marginTop: 8 }}>
            <Pressable
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              onPressIn={onButtonPressIn}
              onPressOut={onButtonPressOut}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {activeTab === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
                </Text>
              )}
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <Pressable style={styles.googleButton}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>{t('auth.continueWithGoogle')}</Text>
          </Pressable>

          {/* Guest link */}
          <Pressable
            style={styles.guestLink}
            onPress={handleGuest}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.guestText}>{t('auth.continueAsGuest')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#051F20',
  },

  // ── Top section ──
  topSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    paddingTop: 52,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(35,83,71,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(142,182,155,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
  },
  locationDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(218,241,222,0.8)',
  },
  locationText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(218,241,222,0.9)',
    letterSpacing: 1.5,
  },
  headlineArea: {
    marginTop: 'auto',
    paddingTop: 40,
  },
  headlineMain: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  headlineSub: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(218,241,222,0.75)',
    lineHeight: 20,
    marginTop: 10,
  },

  // ── Bottom sheet ──
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E2EDE5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // ── Tab switcher ──
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F2',
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#235347',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8EB69B',
  },
  tabTextActive: {
    color: '#051F20',
    fontWeight: '600',
  },

  // ── Inputs ──
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8EB69B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 52,
    backgroundColor: '#F8FAFB',
    borderWidth: 1.5,
    borderColor: '#E2EDE5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#051F20',
  },
  inputFocused: {
    borderColor: '#235347',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  passwordInput: {
    paddingRight: 52,
  },
  showHideButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  showHideText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8EB69B',
  },
  fieldError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },

  // ── Message banners ──
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
  },
  successBanner: {
    backgroundColor: '#DAF1DE',
    borderLeftWidth: 3,
    borderLeftColor: '#235347',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 13,
    color: '#235347',
    lineHeight: 18,
  },

  // ── Primary button ──
  primaryButton: {
    height: 52,
    backgroundColor: '#235347',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // ── Divider ──
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2EDE5',
  },
  dividerText: {
    fontSize: 13,
    color: '#8EB69B',
    marginHorizontal: 12,
  },

  // ── Google button ──
  googleButton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2EDE5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EA4335',
  },
  googleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#051F20',
  },

  // ── Guest link ──
  guestLink: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 13,
    color: '#8EB69B',
    textDecorationLine: 'underline',
  },

})
