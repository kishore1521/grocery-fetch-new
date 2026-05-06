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
import { useAuthStore } from '../../stores/authStore'
import { useListStore } from '../../stores/listStore'
import { UserPreferences, Store } from '../../types'

// ─── Store brand colors ───────────────────────────────────────────────────────

const STORE_COLORS: Record<string, string> = {
  'ShopRite':    '#CC0000',
  'Stop & Shop': '#007A3D',
  'Target':      '#E53935',
  'Walmart':     '#0071CE',
  'Aldi':        '#1E3A5F',
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function BellIcon({ color = '#235347', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function PinIcon({ color = '#8EB69B', size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} />
    </Svg>
  )
}

function TagIcon({ color = '#F97316', size = 10 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRect({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: object
}) {
  return (
    <View style={[{ width: width as number, height, borderRadius, backgroundColor: '#E8EDE8' }, style]} />
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { session, isGuest } = useAuthStore()
  const { items } = useListStore()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = session?.user?.user_metadata?.first_name as string | undefined ?? 'Shopper'

  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = session?.user.id
        if (!userId) {
          setLoading(false)
          return
        }

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
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Section 1: Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {loading ? (
                <>
                  <SkeletonRect width={100} height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                  <SkeletonRect width={160} height={26} borderRadius={8} />
                </>
              ) : (
                <>
                  <Text style={styles.greetingText}>{greeting}</Text>
                  <Text style={styles.firstNameText}>{firstName}</Text>
                </>
              )}
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => Alert.alert('Notifications', 'Coming soon!')}
              activeOpacity={0.7}
            >
              <BellIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.locationRow}>
            <PinIcon />
            <Text style={styles.locationText}>
              {prefs?.zip_code ?? 'Long Island'} · NY
            </Text>
          </View>
        </View>

        {/* ── Section 2: Savings Card ── */}
        <View style={styles.savingsCardWrap}>
          {loading ? (
            <SkeletonRect width="100%" height={160} borderRadius={20} />
          ) : (
            <LinearGradient
              colors={['#051F20', '#0B2B26', '#235347']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.savingsCard}
            >
              {!prefs?.total_receipts_scanned ? (
                /* ─ Start saving version ─ */
                <>
                  <View style={styles.savingsCardTopRow}>
                    <Text style={styles.savingsSparkle}>✨</Text>
                    <Text style={styles.savingsStartTitle}>Start saving today</Text>
                  </View>
                  <Text style={styles.savingsBodyText}>
                    Scan your first receipt after shopping to see how much you're saving vs other Long Island stores.
                  </Text>
                  <View style={styles.howItWorksRow}>
                    <View style={styles.howItWorksStep}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepIcon}>🛒</Text>
                      </View>
                      <Text style={styles.stepLabel}>Build list</Text>
                    </View>
                    <Text style={styles.stepArrow}>→</Text>
                    <View style={styles.howItWorksStep}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepIcon}>🛍</Text>
                      </View>
                      <Text style={styles.stepLabel}>Shop</Text>
                    </View>
                    <Text style={styles.stepArrow}>→</Text>
                    <View style={styles.howItWorksStep}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepIcon}>📷</Text>
                      </View>
                      <Text style={styles.stepLabel}>Scan</Text>
                    </View>
                  </View>
                </>
              ) : (
                /* ─ Real savings version ─ */
                <>
                  <View style={styles.savingsTrophyRow}>
                    <Text style={styles.trophyIcon}>🏆</Text>
                    <Text style={styles.thisMonthLabel}>THIS MONTH</Text>
                    <View style={styles.flex1} />
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
                    <View style={styles.flex1} />
                    <TouchableOpacity style={styles.sharePill}>
                      <Text style={styles.sharePillText}>Share →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </LinearGradient>
          )}
        </View>

        {/* ── Section 3: Active List Preview ── */}
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
                    index < previewItems.length - 1 && styles.previewRowBorder,
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

        {/* ── Section 4: Stores Near You ── */}
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
                  <SkeletonRect width="100%" height={140} borderRadius={16} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.storeGrid}>
              {stores.map(store => {
                const brandColor = STORE_COLORS[store.chain] ?? '#235347'
                return (
                  <TouchableOpacity
                    key={store.id}
                    style={styles.storeCardOuter}
                    onPress={() => router.push(`/store/${store.id}` as never)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.storeCardInner}>
                      {/* Banner */}
                      <View style={[styles.storeBanner, { backgroundColor: brandColor }]}>
                        <View style={styles.storeStripeOverlay} />
                        <Text style={styles.storeChainName}>{store.chain}</Text>
                      </View>

                      {/* Info */}
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

        {/* ── Section 5: Bottom padding ── */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  scrollContent: {
    paddingBottom: 0,
  },
  flex1: { flex: 1 },

  // Header section
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#8EB69B',
    fontWeight: '500',
  },
  firstNameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#8EB69B',
    fontWeight: '500',
  },

  // Savings card
  savingsCardWrap: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  savingsCard: {
    padding: 20,
    borderRadius: 20,
  },

  // Start saving version
  savingsCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsSparkle: {
    fontSize: 18,
  },
  savingsStartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savingsBodyText: {
    fontSize: 13,
    color: 'rgba(218,241,222,0.8)',
    marginTop: 6,
    lineHeight: 20,
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  howItWorksStep: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(218,241,222,0.7)',
    fontWeight: '600',
  },
  stepArrow: {
    fontSize: 12,
    color: 'rgba(218,241,222,0.4)',
    marginTop: -10,
  },

  // Real savings version
  savingsTrophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trophyIcon: {
    fontSize: 16,
  },
  thisMonthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(218,241,222,0.7)',
    letterSpacing: 1.2,
  },
  streakText: {
    fontSize: 11,
    color: 'rgba(218,241,222,0.8)',
  },
  savedLabel: {
    fontSize: 14,
    color: 'rgba(218,241,222,0.7)',
    fontWeight: '400',
    marginTop: 12,
  },
  savedAmount: {
    fontSize: 42,
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
    color: 'rgba(218,241,222,0.65)',
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
    paddingHorizontal: 20,
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
    color: '#051F20',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 13,
    color: '#235347',
    fontWeight: '600',
  },

  // List preview card
  listPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  previewRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#235347',
    marginRight: 10,
    flexShrink: 0,
  },
  previewItemName: {
    fontSize: 14,
    color: '#051F20',
    fontWeight: '500',
    flex: 1,
  },
  previewMore: {
    fontSize: 12,
    color: '#8EB69B',
    textAlign: 'center',
    paddingTop: 10,
  },
  viewListBtn: {
    marginTop: 12,
    backgroundColor: '#F0F9F0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  viewListBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#235347',
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
  storeCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  storeBanner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  storeStripeOverlay: {
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
    padding: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  storeFullName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#051F20',
  },
  storeAddress: {
    fontSize: 11,
    color: '#8EB69B',
    marginTop: 1,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  loyaltyName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F97316',
  },

  // Bottom padding
  bottomPadding: {
    height: 100,
  },
})
