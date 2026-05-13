import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { onboardingData } from '../../lib/onboardingState'

const { width: screenWidth } = Dimensions.get('window')
// 2-column grid: 24px padding each side + 12px gap between columns
const CARD_WIDTH = (screenWidth - 48 - 12) / 2

// ─── Store data ───────────────────────────────────────────────────────────────

const STORES = [
  {
    id: 'shoprite',
    chain: 'ShopRite',
    tagline: 'Westbury · Price Plus card',
    color: '#CC0000',
    hasLoyalty: true,
  },
  {
    id: 'stopandshop',
    chain: 'Stop & Shop',
    tagline: 'Hicksville · GO Rewards card',
    color: '#007A3D',
    hasLoyalty: true,
  },
  {
    id: 'target',
    chain: 'Target',
    tagline: 'Carle Place · No loyalty card',
    color: '#E53935',
    hasLoyalty: false,
  },
  {
    id: 'walmart',
    chain: 'Walmart',
    tagline: 'Levittown · No loyalty card',
    color: '#0071CE',
    hasLoyalty: false,
  },
  {
    id: 'aldi',
    chain: 'Aldi',
    tagline: 'Westbury · No loyalty card',
    color: '#1E3A5F',
    hasLoyalty: false,
  },
]

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean
  onToggle: () => void
}

function Toggle({ value, onToggle }: ToggleProps) {
  const slideAnim = useRef(new Animated.Value(value ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  })

  return (
    <Pressable onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </View>
    </Pressable>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Step2Stores() {
  const { t } = useTranslation()
  // Restore selection from onboardingData if user came back
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    onboardingData.selectedStores
      .map(chain => STORES.find(s => s.chain === chain)?.id)
      .filter(Boolean) as string[]
  )
  const [loyaltyShoprite, setLoyaltyShoprite] = useState(onboardingData.loyaltyShoprite)
  const [loyaltyStopAndShop, setLoyaltyStopAndShop] = useState(onboardingData.loyaltyStopAndShop)

  const progressAnim = useRef(new Animated.Value(0)).current
  const loyaltyAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 75,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasLoyaltyStores =
    selectedIds.includes('shoprite') || selectedIds.includes('stopandshop')

  useEffect(() => {
    Animated.timing(loyaltyAnim, {
      toValue: hasLoyaltyStores ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [hasLoyaltyStores]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStore = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleContinue = () => {
    onboardingData.selectedStores = selectedIds.map(
      id => STORES.find(s => s.id === id)?.chain ?? id
    )
    onboardingData.loyaltyShoprite = loyaltyShoprite
    onboardingData.loyaltyStopAndShop = loyaltyStopAndShop
    router.replace('/onboarding/step3-household')
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  })

  // Height for loyalty section: title ~24px + each row ~44px + padding ~16px
  const loyaltyRows = [
    ...(selectedIds.includes('shoprite')
      ? [{ id: 'shoprite', name: 'ShopRite', color: '#CC0000', value: loyaltyShoprite, toggle: () => setLoyaltyShoprite(v => !v) }]
      : []),
    ...(selectedIds.includes('stopandshop')
      ? [{ id: 'stopandshop', name: 'Stop & Shop', color: '#007A3D', value: loyaltyStopAndShop, toggle: () => setLoyaltyStopAndShop(v => !v) }]
      : []),
  ]

  const maxLoyaltyH = loyaltyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24 + loyaltyRows.length * 48 + 16],
  })

  const isComplete = selectedIds.length > 0

  return (
    <SafeAreaView style={styles.root}>
      {/* Progress bar */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/onboarding/step1-zip')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepCounter}>
          {t('onboarding.stepCounter', { step: 3, total: 4 })}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t('onboarding.stores.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.stores.subtitle')}</Text>

        {/* Store card grid */}
        <View style={styles.storeGrid}>
          {STORES.map(store => {
            const isSelected = selectedIds.includes(store.id)
            return (
              <Pressable
                key={store.id}
                style={({ pressed }) => [
                  styles.storeCard,
                  isSelected && styles.storeCardSelected,
                  pressed && styles.storeCardPressed,
                ]}
                onPress={() => toggleStore(store.id)}
              >
                {/* Left accent bar */}
                <View style={[styles.accentBar, { backgroundColor: store.color }]} />

                {/* Card content */}
                <View style={styles.cardContent}>
                  <Text style={styles.storeName}>{store.chain}</Text>
                  <Text style={styles.storeTagline} numberOfLines={2}>
                    {store.tagline}
                  </Text>
                </View>

                {/* Selected checkmark badge */}
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>

        {/* Loyalty cards section — slides down when a loyalty store is selected */}
        <Animated.View
          style={[styles.loyaltySection, { maxHeight: maxLoyaltyH, overflow: 'hidden' }]}
        >
          <Text style={styles.loyaltyTitle}>{t('onboarding.stores.loyaltyTitle')}</Text>
          {loyaltyRows.map(row => (
            <View key={row.id} style={styles.loyaltyRow}>
              <View style={styles.loyaltyLeft}>
                <View style={[styles.loyaltyDot, { backgroundColor: row.color }]} />
                <Text style={styles.loyaltyName}>{row.name}</Text>
              </View>
              <Toggle value={row.value} onToggle={row.toggle} />
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Continue button */}
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
    marginBottom: 24,
    lineHeight: 22,
  },

  // Store grid
  storeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  storeCard: {
    width: CARD_WIDTH,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2EDE5',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  storeCardSelected: {
    borderColor: '#235347',
    backgroundColor: '#F8FAFB',
  },
  storeCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  accentBar: {
    width: 4,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    paddingTop: 14,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#051F20',
    lineHeight: 20,
  },
  storeTagline: {
    fontSize: 11,
    color: '#8EB69B',
    marginTop: 3,
    lineHeight: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#235347',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 14,
  },

  // Loyalty section
  loyaltySection: {
    marginTop: 20,
    overflow: 'hidden',
  },
  loyaltyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#051F20',
    marginBottom: 8,
  },
  loyaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F2',
  },
  loyaltyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loyaltyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loyaltyName: {
    fontSize: 14,
    color: '#051F20',
    fontWeight: '400',
  },

  // Toggle
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2EDE5',
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: '#235347',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
