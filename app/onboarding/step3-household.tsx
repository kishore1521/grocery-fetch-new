import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { onboardingData } from '../../lib/onboardingState'

// ─── Reusable option row ──────────────────────────────────────────────────────

interface OptionRowProps {
  options: { label: string; value: string }[]
  selected: string | null
  onSelect: (value: string) => void
  twoColumn?: boolean
}

function OptionRow({ options, selected, onSelect, twoColumn = false }: OptionRowProps) {
  return (
    <View style={[styles.optionRow, twoColumn && styles.optionRowWrap]}>
      {options.map(opt => {
        const isSelected = selected === opt.value
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionButton,
              twoColumn && styles.optionButtonHalf,
              isSelected && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.optionText, isSelected && styles.optionTextSelected]}
              numberOfLines={2}
              textBreakStrategy="simple"
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Step3Household() {
  const { t } = useTranslation()
  const { isGuest } = useAuthStore()

  const HOUSEHOLD_OPTIONS = [
    { label: t('onboarding.household.justMe'), value: '1' },
    { label: '2', value: '2' },
    { label: '3–4', value: '3-4' },
    { label: '5+', value: '5+' },
  ]

  const BUDGET_OPTIONS = [
    { label: '< $100', value: 'under100' },
    { label: '$100–200', value: '100-200' },
    { label: '$200–300', value: '200-300' },
    { label: '$300+', value: '300+' },
  ]

  const FREQUENCY_OPTIONS = [
    { label: t('onboarding.household.daily'), value: 'daily' },
    { label: t('onboarding.household.fewTimesWeek'), value: '2-3week' },
    { label: t('onboarding.household.weekly'), value: 'weekly' },
    { label: t('onboarding.household.everyTwoWeeks'), value: 'biweekly' },
  ]

  const [householdSize, setHouseholdSize] = useState<string | null>(null)
  const [weeklyBudget, setWeeklyBudget] = useState<string | null>(null)
  const [shoppingFrequency, setShoppingFrequency] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isComplete =
    householdSize !== null && weeklyBudget !== null && shoppingFrequency !== null

  const handleContinue = async () => {
    if (!isComplete) return
    setError(null)
    setLoading(true)

    try {
      if (isGuest) {
        // Guest: skip Supabase, go straight to complete
        router.replace('/onboarding/complete')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          zip_code: onboardingData.zipCode,
          preferred_stores: onboardingData.selectedStores,
          has_loyalty_shoprite: onboardingData.loyaltyShoprite,
          has_loyalty_stopandshop: onboardingData.loyaltyStopAndShop,
          household_size: householdSize,
          weekly_budget: weeklyBudget,
          shopping_frequency: shoppingFrequency,
          language: onboardingData.language,
        }, { onConflict: 'user_id' })

      if (error) throw error

      router.replace('/onboarding/complete')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common.error')
      setError(t('onboarding.household.errorSave') + ' ' + msg)
    } finally {
      setLoading(false)
    }
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/onboarding/step2-stores')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stepCounter}>
            {t('onboarding.stepCounter', { step: 4, total: 4 })}
          </Text>
        </View>

        <Text style={styles.title}>{t('onboarding.household.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.household.subtitle')}</Text>

        {/* Section 1: Household size */}
        <Text style={styles.sectionLabel}>{t('onboarding.household.size')}</Text>
        <OptionRow
          options={HOUSEHOLD_OPTIONS}
          selected={householdSize}
          onSelect={setHouseholdSize}
        />

        {/* Section 2: Weekly budget */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('onboarding.household.budget')}
        </Text>
        <OptionRow
          options={BUDGET_OPTIONS}
          selected={weeklyBudget}
          onSelect={setWeeklyBudget}
        />

        {/* Section 3: Shopping frequency */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>
          {t('onboarding.household.frequency')}
        </Text>
        <OptionRow
          options={FREQUENCY_OPTIONS}
          selected={shoppingFrequency}
          onSelect={setShoppingFrequency}
          twoColumn
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      {/* Continue button */}
      <View style={styles.buttonArea}>
        <TouchableOpacity
          style={[styles.continueButton, (!isComplete || loading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isComplete || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>{t('onboarding.household.cta')}</Text>
          )}
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

  // Scroll + content
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.5,
    marginTop: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#8EB69B',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 22,
  },

  // Sections
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051F20',
    marginTop: 32,
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 24,
  },

  // Option buttons
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionRowWrap: {
    flexWrap: 'wrap',
  },
  optionButton: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2EDE5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  optionButtonHalf: {
    flexBasis: '48%',
    flexGrow: 0,
    flex: 0,
  },
  optionButtonSelected: {
    backgroundColor: '#235347',
    borderColor: '#235347',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8EB69B',
    textAlign: 'center',
    lineHeight: 18,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },

  // Error
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
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
