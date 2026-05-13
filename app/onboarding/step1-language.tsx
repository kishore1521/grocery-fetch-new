import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { onboardingData } from '../../lib/onboardingState'
import { useAuthStore } from '../../stores/authStore'

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', nameKey: 'onboarding.language.english', nativeName: 'English' },
  { code: 'ko', flag: '🇰🇷', nameKey: 'onboarding.language.korean', nativeName: '한국어' },
  { code: 'es', flag: '🇪🇸', nameKey: 'onboarding.language.spanish', nativeName: 'Español' },
]

export default function Step1Language() {
  const { t } = useTranslation()
  const { setLanguage, language } = useAuthStore()
  const [selected, setSelected] = useState(language ?? 'en')

  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 25,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (code: string) => {
    setSelected(code)
    setLanguage(code)
    onboardingData.language = code
  }

  const handleContinue = () => {
    onboardingData.language = selected
    router.push('/onboarding/step1-zip')
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.root}>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Text style={styles.stepCounter}>
          {t('onboarding.stepCounter', { step: 1, total: 4 })}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>🌐</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.language.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.language.subtitle')}</Text>

        {/* Language options */}
        <View style={styles.optionsList}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langButton, isSelected && styles.langButtonSelected]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                  {lang.nativeName}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.buttonArea}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Progress bar
  progressBg: {
    height: 4,
    backgroundColor: '#F1F5F2',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#235347',
    borderRadius: 2,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 40,
  },
  stepCounter: {
    fontSize: 12,
    color: '#8EB69B',
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DAF1DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.5,
    marginTop: 28,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#8EB69B',
    marginTop: 8,
    lineHeight: 22,
  },

  // Language options
  optionsList: {
    marginTop: 32,
    gap: 12,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderWidth: 1.5,
    borderColor: '#E2EDE5',
    borderRadius: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  langButtonSelected: {
    borderColor: '#235347',
    backgroundColor: '#F4FAF6',
  },
  langFlag: {
    fontSize: 24,
  },
  langName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#8EB69B',
  },
  langNameSelected: {
    color: '#051F20',
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#235347',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Button
  buttonArea: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  continueButton: {
    height: 52,
    backgroundColor: '#235347',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
