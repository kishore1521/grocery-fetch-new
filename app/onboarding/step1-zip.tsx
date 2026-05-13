import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { onboardingData } from '../../lib/onboardingState'

export default function Step1Zip() {
  const { t } = useTranslation()
  const [zip, setZip] = useState(onboardingData.zipCode)
  const [focused, setFocused] = useState(false)

  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 50,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete = zip.length === 5

  const handleContinue = () => {
    if (!isComplete) return
    onboardingData.zipCode = zip
    router.replace('/onboarding/step2-stores')
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Progress bar — stays outside ScrollView */}
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/onboarding/step1-language')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepCounter}>
              {t('onboarding.stepCounter', { step: 2, total: 4 })}
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.illustrationWrap}>
              <View style={styles.illustrationCircle}>
                <Text style={styles.illustrationEmoji}>📍</Text>
              </View>
            </View>

            <Text style={styles.title}>{t('onboarding.zip.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.zip.subtitle')}</Text>

            <TextInput
              style={[styles.zipInput, (focused || isComplete) && styles.zipInputActive]}
              value={zip}
              onChangeText={(text) => setZip(text.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder={t('onboarding.zip.placeholder')}
              placeholderTextColor="#C5D5CE"
              keyboardType="number-pad"
              maxLength={5}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
            />

            {isComplete ? (
              <Text style={styles.checkmark}>{t('onboarding.zip.valid')}</Text>
            ) : (
              <View style={styles.checkmarkSpacer} />
            )}

            <Text style={styles.helperText}>{t('onboarding.zip.helper')}</Text>
          </View>
        </ScrollView>

        {/* Continue button — outside ScrollView, inside KeyboardAvoidingView */}
        <View style={styles.buttonArea}>
          <TouchableOpacity
            style={[styles.continueButton, !isComplete && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!isComplete}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#235347',
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
    marginTop: 40,
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
    marginTop: 32,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#8EB69B',
    marginTop: 8,
    lineHeight: 22,
  },
  zipInput: {
    marginTop: 32,
    height: 64,
    backgroundColor: '#F8FAFB',
    borderWidth: 2,
    borderColor: '#E2EDE5',
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: '#051F20',
    letterSpacing: 4,
  },
  zipInputActive: {
    borderColor: '#235347',
    backgroundColor: '#FFFFFF',
  },
  checkmark: {
    textAlign: 'center',
    color: '#235347',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 10,
  },
  checkmarkSpacer: {
    height: 30,
  },
  helperText: {
    fontSize: 12,
    color: '#8EB69B',
    textAlign: 'center',
    marginTop: 4,
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
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
