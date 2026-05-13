import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import Svg, { Path, Line, Circle } from 'react-native-svg'
import { colors } from '../constants/colors'
import { useListStore } from '../stores/listStore'
import { compareStores, CompareResult, StoreResult } from '../lib/compareStores'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORE_COLORS: Record<string, string> = {
  'ShopRite':    '#CC0000',
  'Stop & Shop': '#007A3D',
  'Aldi':        '#1E3A5F',
  'Target':      '#E53935',
  'Walmart':     '#0071CE',
  'BJs':         '#0047AB',
  'Costco':      '#005DAA',
}

function getStoreColor(chain: string) {
  return STORE_COLORS[chain] ?? colors.primary
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round">
      <Path d={expanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
    </Svg>
  )
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  )
}

function SplitIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5" />
      <Path d="M21 3l-7 7M3 3l7 7M3 21l7-7M21 21l-7-7" />
    </Svg>
  )
}

// ─── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({
  result,
  rank,
  expanded,
  onToggle,
}: {
  result: StoreResult
  rank: number
  expanded: boolean
  onToggle: () => void
}) {
  const storeColor = getStoreColor(result.store_chain)
  const isBest = rank === 0 && result.is_complete
  const coverageText = result.is_complete
    ? `All ${result.total_count} items`
    : `${result.covered_count} of ${result.total_count} items`

  return (
    <View style={[styles.storeCard, isBest && styles.storeCardBest]}>
      {/* Best badge */}
      {isBest && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>BEST VALUE</Text>
        </View>
      )}

      {/* Header row */}
      <TouchableOpacity
        style={styles.storeCardHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        {/* Store color dot + name */}
        <View style={[styles.storeColorBar, { backgroundColor: storeColor }]} />
        <View style={styles.storeNameCol}>
          <Text style={styles.storeChainName}>{result.store_chain}</Text>
          <View style={styles.coverageRow}>
            {result.is_complete
              ? <CheckIcon />
              : (
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={colors.orange} strokeWidth={2.5} strokeLinecap="round">
                  <Path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </Svg>
              )
            }
            <Text style={[
              styles.coverageText,
              !result.is_complete && styles.coverageTextWarn,
            ]}>
              {coverageText}
            </Text>
          </View>
        </View>

        {/* Total + chevron */}
        <View style={styles.storeTotalCol}>
          <Text style={[styles.storeTotal, isBest && styles.storeTotalBest]}>
            ${result.total.toFixed(2)}
          </Text>
          <ChevronIcon expanded={expanded} />
        </View>
      </TouchableOpacity>

      {/* Missing items */}
      {result.missing_names.length > 0 && (
        <View style={styles.missingRow}>
          <Text style={styles.missingLabel}>Not carried: </Text>
          <Text style={styles.missingText}>{result.missing_names.join(', ')}</Text>
        </View>
      )}

      {/* Expanded item list */}
      {expanded && (
        <View style={styles.itemList}>
          <View style={styles.itemListDivider} />
          {result.items.map(item => (
            <View key={item.product_id} style={styles.itemRow}>
              <Text style={styles.itemRowName} numberOfLines={1}>
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
              </Text>
              <View style={styles.itemRowPriceCol}>
                {item.loyalty_price != null && (
                  <Text style={styles.itemRowLoyalty}>
                    ${item.loyalty_price.toFixed(2)} w/ loyalty
                  </Text>
                )}
                <Text style={styles.itemRowPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.itemListFooter}>
            <Text style={styles.itemListTotal}>Total</Text>
            <Text style={styles.itemListTotalValue}>${result.total.toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WhereToShopScreen() {
  const { items } = useListStore()
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    compareStores(items)
      .then(r => { setResult(r); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleExpanded = (storeId: string) => {
    setExpanded(prev => ({ ...prev, [storeId]: !prev[storeId] }))
  }

  return (
    <View style={styles.root}>

      {/* ── HERO ── */}
      <LinearGradient
        colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <BackIcon />
            </TouchableOpacity>
            <Text style={styles.heroLabel}>GROCERY LIST</Text>
            <Text style={styles.heroTitle}>Where to Shop</Text>
            {result && !loading && (
              <Text style={styles.heroSub}>
                {result.priced_count} items compared across {result.single_store.length} store{result.single_store.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── WHITE SHEET ── */}
      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Comparing prices…</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptySub}>Check your connection and go back to try again.</Text>
          </View>
        ) : !result || result.single_store.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Not enough priced items</Text>
            <Text style={styles.emptySub}>Add at least 3 items from our product database to compare stores.</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* Skipped items note */}
            {result.skipped_names.length > 0 && (
              <View style={styles.skippedNote}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                  stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round">
                  <Circle cx="12" cy="12" r="10" />
                  <Path d="M12 8v4M12 16h.01" />
                </Svg>
                <Text style={styles.skippedText}>
                  {result.skipped_names.length} item{result.skipped_names.length > 1 ? 's' : ''} not in our database and excluded:{' '}
                  <Text style={styles.skippedNames}>{result.skipped_names.join(', ')}</Text>
                </Text>
              </View>
            )}

            {/* ── SECTION 1: Best Single Store ── */}
            <Text style={styles.sectionLabel}>BEST SINGLE STORE</Text>
            <Text style={styles.sectionSub}>Ranked cheapest to most expensive for your full list</Text>

            {result.single_store.map((store, i) => (
              <StoreCard
                key={store.store_id}
                result={store}
                rank={i}
                expanded={!!expanded[store.store_id]}
                onToggle={() => toggleExpanded(store.store_id)}
              />
            ))}

            {/* ── SECTION 2: Trip Split ── */}
            {result.trip_split && (
              <View style={styles.splitSection}>
                {/* Split header */}
                <View style={styles.splitHeaderRow}>
                  <Text style={styles.sectionLabel}>SMART TRIP SPLIT</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>
                      Save ${result.trip_split.savings.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.sectionSub}>
                  Buy each item at its cheapest store — costs ${result.trip_split.grand_total.toFixed(2)} total vs ${(result.trip_split.grand_total + result.trip_split.savings).toFixed(2)} at one store
                </Text>

                {/* Per-store groups */}
                {result.trip_split.stores.map((store) => (
                  <View key={store.store_chain} style={styles.splitStoreCard}>
                    <View style={styles.splitStoreHeader}>
                      <View style={[styles.splitStoreDot, { backgroundColor: getStoreColor(store.store_chain) }]} />
                      <Text style={styles.splitStoreName}>{store.store_chain}</Text>
                      <Text style={styles.splitStoreCount}>
                        {store.items.length} item{store.items.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.splitStoreSubtotal}>${store.subtotal.toFixed(2)}</Text>
                    </View>
                    {store.items.map(item => (
                      <View key={item.product_id} style={styles.splitItemRow}>
                        <View style={styles.splitItemDot} />
                        <Text style={styles.splitItemName} numberOfLines={1}>
                          {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                        </Text>
                        <Text style={styles.splitItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                ))}

                {/* Grand total */}
                <View style={styles.splitGrandTotal}>
                  <Text style={styles.splitGrandTotalLabel}>Grand Total</Text>
                  <Text style={styles.splitGrandTotalValue}>${result.trip_split.grand_total.toFixed(2)}</Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: { overflow: 'hidden' },
  heroCircle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: -20, left: -30,
  },
  heroInner: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2,
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.5, lineHeight: 34,
  },
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    fontWeight: '500', marginTop: 4,
  },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: 'hidden',
  },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },

  // Loading / empty
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  loadingText: { fontSize: 14, color: colors.textTertiary, fontWeight: '500' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },

  // Skipped note
  skippedNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  skippedText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  skippedNames: { fontWeight: '600', color: colors.textPrimary },

  // Section labels
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textTertiary,
    letterSpacing: 1.1, marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13, color: colors.textTertiary,
    fontWeight: '400', marginBottom: 14, lineHeight: 18,
  },

  // Store card
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  storeCardBest: {
    borderColor: colors.primaryBorder,
    borderWidth: 1.5,
  },
  bestBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  bestBadgeText: {
    fontSize: 10, fontWeight: '800', color: colors.primary,
    letterSpacing: 1.2,
  },
  storeCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingRight: 14,
    gap: 12,
  },
  storeColorBar: { width: 5, alignSelf: 'stretch', borderRadius: 0 },
  storeNameCol: { flex: 1, gap: 4 },
  storeChainName: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
  },
  coverageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coverageText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  coverageTextWarn: { color: colors.orange },
  storeTotalCol: { alignItems: 'flex-end', gap: 4 },
  storeTotal: {
    fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5,
  },
  storeTotalBest: { color: colors.primary },

  // Missing items
  missingRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingBottom: 10,
    gap: 2,
  },
  missingLabel: { fontSize: 12, color: colors.orange, fontWeight: '700' },
  missingText: { fontSize: 12, color: colors.textSecondary, flex: 1 },

  // Expanded item list
  itemList: { paddingHorizontal: 16, paddingBottom: 14 },
  itemListDivider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, gap: 8,
  },
  itemRowName: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  itemRowPriceCol: { alignItems: 'flex-end', gap: 1 },
  itemRowLoyalty: { fontSize: 10, color: colors.orange, fontWeight: '500' },
  itemRowPrice: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  itemListFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: 10, marginTop: 4,
  },
  itemListTotal: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  itemListTotalValue: { fontSize: 15, fontWeight: '800', color: colors.primary },

  // Trip split section
  splitSection: { marginTop: 28 },
  splitHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  savingsBadge: {
    backgroundColor: colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  savingsBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },

  splitStoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  splitStoreHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, gap: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  splitStoreDot: { width: 10, height: 10, borderRadius: 5 },
  splitStoreName: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  splitStoreCount: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },
  splitStoreSubtotal: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  splitItemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 14, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  splitItemDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  splitItemName: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '400' },
  splitItemPrice: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  splitGrandTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14, padding: 16, marginTop: 4,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  splitGrandTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.primary },
  splitGrandTotalValue: { fontSize: 24, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
})
