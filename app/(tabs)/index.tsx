import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { useListStore } from '../../stores/listStore'
import { UserPreferences, Store } from '../../types'

// ─── Store colors ─────────────────────────────────────────────────────────────

const STORE_COLORS: Record<string, string> = {
  'ShopRite':    '#CC0000',
  'Stop & Shop': '#007A3D',
  'Target':      '#E53935',
  'Walmart':     '#0071CE',
  'Aldi':        '#1E3A5F',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="rgba(255,255,255,0.8)" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 01-3.46 0"
        stroke="rgba(255,255,255,0.8)" strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function PinIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke="rgba(255,255,255,0.7)" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3"
        stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
    </Svg>
  )
}

function TagIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={colors.orange} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="7" x2="7.01" y2="7"
        stroke={colors.orange} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { session, isGuest } = useAuthStore()
  const { items } = useListStore()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (session?.user?.user_metadata?.first_name as string | undefined) ?? 'Shopper'
  const zipCode = prefs?.zip_code ?? 'Long Island'

  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = session?.user.id
        if (!userId) { setLoading(false); return }
        const [prefsRes, storesRes] = await Promise.all([
          supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
          supabase.from('stores').select('*').eq('is_active', true),
        ])
        if (prefsRes.data) setPrefs(prefsRes.data as UserPreferences)
        if (storesRes.data) setStores(storesRes.data as Store[])
      } catch (e: unknown) {
        console.error('[Home] load error:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const uncheckedItems = items.filter(i => !i.is_checked)
  const previewItems = uncheckedItems.slice(0, 3)
  const extraCount = uncheckedItems.length - 3

  return (
    <View style={styles.root}>

      {/* ── HERO ── */}
      <LinearGradient
        colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative circles */}
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            {/* Top row: greeting + bell */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroGreeting}>{greeting}</Text>
                <Text style={styles.heroName}>{firstName}</Text>
              </View>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => Alert.alert('Notifications', 'Coming soon!')}
                activeOpacity={0.7}
              >
                <BellIcon />
              </TouchableOpacity>
            </View>

            {/* Location pill */}
            <View style={styles.locationPill}>
              <PinIcon />
              <Text style={styles.locationText}>{zipCode} · Long Island, NY</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── WHITE SHEET ── */}
      <View style={styles.sheetContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ── Savings card ── */}
          <View style={styles.savingsCardWrap}>
            {loading ? (
              <View style={[styles.savingsCardSkeleton]} />
            ) : (
              <LinearGradient
                colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.savingsCard}
              >
                <View style={styles.savingsCircle1} />
                {!prefs?.total_receipts_scanned ? (
                  <>
                    <View style={styles.savingsTopRow}>
                      <Text style={styles.savingsSparkle}>✨</Text>
                      <Text style={styles.savingsStartTitle}>Start saving today</Text>
                    </View>
                    <Text style={styles.savingsBodyText}>
                      Scan your first receipt after shopping to see how much you're saving vs other Long Island stores.
                    </Text>
                    <View style={styles.howItWorksRow}>
                      {[
                        { icon: '🛒', label: 'Build list' },
                        { icon: '🛍', label: 'Shop' },
                        { icon: '📷', label: 'Scan' },
                      ].map((step, i) => (
                        <View key={step.label} style={styles.howItWorksStep}>
                          {i > 0 && <Text style={styles.stepArrow}>→</Text>}
                          <View style={styles.stepWrap}>
                            <View style={styles.stepCircle}>
                              <Text style={styles.stepIcon}>{step.icon}</Text>
                            </View>
                            <Text style={styles.stepLabel}>{step.label}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.savingsTopRow}>
                      <Text style={styles.trophyIcon}>🏆</Text>
                      <Text style={styles.thisMonthLabel}>THIS MONTH</Text>
                      <View style={{ flex: 1 }} />
                      {(prefs.streak_count ?? 0) >= 1 && (
                        <Text style={styles.streakText}>🔥 {prefs.streak_count} week streak</Text>
                      )}
                    </View>
                    <Text style={styles.savedLabel}>You've saved</Text>
                    <Text style={styles.savedAmount}>
                      ${Number(prefs.total_savings_this_month ?? 0).toFixed(2)}
                    </Text>
                    <View style={styles.savingsFooter}>
                      <Text style={styles.tripsText}>
                        {prefs.total_receipts_scanned} trip{prefs.total_receipts_scanned !== 1 ? 's' : ''} scanned
                      </Text>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity style={styles.sharePill}>
                        <Text style={styles.sharePillText}>Share →</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </LinearGradient>
            )}
          </View>

          {/* ── Active list preview ── */}
          {!loading && uncheckedItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your List</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/list')}>
                  <Text style={styles.sectionLink}>{uncheckedItems.length} items →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.listPreviewCard}>
                {previewItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.previewRow,
                      index < previewItems.length - 1 && styles.previewRowDivider,
                    ]}
                  >
                    <View style={styles.previewDot} />
                    <Text style={styles.previewItemName} numberOfLines={1}>
                      {item.product?.name ?? item.custom_item_name ?? 'Item'}
                    </Text>
                  </View>
                ))}
                {extraCount > 0 && (
                  <Text style={styles.previewMore}>+ {extraCount} more items</Text>
                )}
                <TouchableOpacity
                  style={styles.viewListBtn}
                  onPress={() => router.push('/(tabs)/list')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewListBtnText}>View full list →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Stores Near You ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Stores Near You</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.storeGrid}>
                {[1, 2, 3, 4].map(n => (
                  <View key={n} style={styles.storeCardOuter}>
                    <View style={styles.storeCardSkeleton} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.storeGrid}>
                {stores.map(store => {
                  const brandColor = STORE_COLORS[store.chain] ?? colors.primaryDark
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={styles.storeCardOuter}
                      onPress={() => router.push(`/store/${store.id}` as never)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.storeCardInner}>
                        <View style={[styles.storeBanner, { backgroundColor: brandColor }]}>
                          <View style={styles.storeBannerOverlay} />
                          <Text style={styles.storeChainName}>{store.chain}</Text>
                        </View>
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeFullName} numberOfLines={1}>{store.name}</Text>
                          {store.address ? (
                            <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                          ) : null}
                          {store.has_loyalty && store.loyalty_name ? (
                            <View style={styles.loyaltyBadge}>
                              <TagIcon />
                              <Text style={styles.loyaltyName}>{store.loyalty_name}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero
  hero: {
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -50,
  },
  heroCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 0,
    left: -20,
  },
  heroInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroLeft: {
    flex: 1,
  },
  heroGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 3,
  },
  heroName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },

  // White sheet
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: 20,
  },

  // Savings card
  savingsCardWrap: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.heroDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  savingsCardSkeleton: {
    height: 160,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  savingsCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  savingsCircle1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -40,
  },
  savingsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsSparkle: { fontSize: 18 },
  savingsStartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savingsBodyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 20,
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 0,
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepArrow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  stepWrap: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 16 },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  trophyIcon: { fontSize: 16 },
  thisMonthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.2,
  },
  streakText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  savedLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 14,
  },
  savedAmount: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  savingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  tripsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  sharePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sharePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },

  // List preview
  listPreviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  previewRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  previewDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 10,
    flexShrink: 0,
  },
  previewItemName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  previewMore: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingTop: 10,
  },
  viewListBtn: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  viewListBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  // Store grid
  storeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  storeCardOuter: {
    width: '50%',
    padding: 6,
  },
  storeCardSkeleton: {
    height: 140,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
  },
  storeCardInner: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  storeBanner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  storeBannerOverlay: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    opacity: 0.06,
    transform: [{ rotate: '-45deg' }],
    left: -50,
  },
  storeChainName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  storeInfo: {
    padding: 12,
  },
  storeFullName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  storeAddress: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: colors.orangeLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  loyaltyName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.orange,
  },
})
