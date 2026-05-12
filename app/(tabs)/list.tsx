import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardEvent,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions,
} from 'react-native'
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg'

import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { useList } from '../../hooks/useList'
import { supabase } from '../../lib/supabase'
import {
  searchProductsByConcept,
  ConceptGroup,
  StoreOption,
  getDefaultUnit,
} from '../../lib/searchProducts'
import { GroceryListItem } from '../../types'

const screenHeight = Dimensions.get('window').height

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const SearchIconSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
    stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
)

// ─── Helper functions ─────────────────────────────────────────────────────────

const getCategoryColor = (category: string): string => {
  const map: Record<string, string> = {
    produce:   '#4CAF50',
    dairy:     '#2196F3',
    meat:      '#F44336',
    bakery:    '#FF9800',
    beverages: '#00BCD4',
    frozen:    '#9C27B0',
    pantry:    '#795548',
    household: '#607D8B',
    deli:      '#FF5722',
    other:     '#9E9E9E',
  }
  return map[category] || '#9E9E9E'
}

const getStoreColor = (chain: string): string => {
  const map: Record<string, string> = {
    'ShopRite':   '#CC0000',
    'Stop & Shop': '#007A3D',
    'Aldi':       '#1E3A5F',
    'BJs':        '#0047AB',
    'Costco':     '#005DAA',
    'Walmart':    '#0071CE',
    'Target':     '#E53935',
  }
  return map[chain] || '#4B5563'
}

// ─── Category ordering ────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'produce', 'dairy', 'meat', 'bakery',
  'beverages', 'frozen', 'pantry',
  'household', 'deli', 'other',
]

// ─── Constants ────────────────────────────────────────────────────────────────

const BUDGET_PRESETS = [100, 150, 200, 250, 300, 400]


const UNIT_OPTIONS = [
  'each', 'pack', 'lb', 'oz',
  'gallon', 'bottle', 'bag',
  'box', 'can', 'bunch', 'dozen', 'pint',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListScreen() {
  const { session, isGuest } = useAuthStore()
  const {
    items,
    loading,
    error,
    toggleChecked,
    updateQuantity,
    deleteItem,
    clearChecked,
    fetchActiveList,
    addCustomItemFull,
    addProductToListById,
  } = useList()

  // ── Input / search state ─────────────────────────────────────────────────
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [inputText, setInputText] = useState('')
  const [searchResults, setSearchResults] = useState<ConceptGroup[]>([])
  const [searching, setSearching] = useState(false)
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set())
  const [expandedSizes, setExpandedSizes] = useState<Set<string>>(new Set())
  const [selectedOption, setSelectedOption] = useState<StoreOption | null>(null)
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [addedConfirm, setAddedConfirm] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const INPUT_BAR_HEIGHT = 66

  // ── Mini form state ──────────────────────────────────────────────────────
  const [showingMiniForm, setShowingMiniForm] = useState(false)
  const [isInMiniForm, setIsInMiniForm] = useState(false)
  const [miniFormQty, setMiniFormQty] = useState(1)
  const [miniFormUnit, setMiniFormUnit] = useState('each')
  const [miniFormNote, setMiniFormNote] = useState('')

  // ── Delete reveal state ──────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Checkbox animations ──────────────────────────────────────────────────
  const checkAnimations = useRef<Record<string, Animated.Value>>({})

  const getCheckAnim = (id: string): Animated.Value => {
    if (!checkAnimations.current[id]) {
      checkAnimations.current[id] = new Animated.Value(1)
    }
    return checkAnimations.current[id]
  }

  const handleToggle = (id: string) => {
    const anim = getCheckAnim(id)
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(anim, { toValue: 1,    useNativeDriver: true, speed: 20 }),
    ]).start()
    toggleChecked(id)
  }

  // ── Skeleton pulse animation ─────────────────────────────────────────────
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Budget state ─────────────────────────────────────────────────────────
  const [budget, setBudget] = useState<number | null>(null)
  const [spentSoFar, setSpentSoFar] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  // ── Fetch list on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isGuest) fetchActiveList()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch budget on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (isGuest || !session?.user.id) return
    const monthYear = new Date().toISOString().slice(0, 7)
    supabase
      .from('budgets')
      .select('monthly_budget, spent_so_far, trip_count')
      .eq('user_id', session.user.id)
      .eq('month_year', monthYear)
      .single()
      .then(({ data }) => {
        if (data) {
          setBudget(Number(data.monthly_budget))
          setSpentSoFar(Number(data.spent_so_far))
          setTripCount(Number(data.trip_count))
        }
      })
  }, [session?.user.id, isGuest])

  // ── Keyboard listeners ───────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener(
      'keyboardWillShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height)
    )
    const hideSub = Keyboard.addListener(
      'keyboardWillHide',
      () => setKeyboardHeight(0)
    )
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // ── Search with debounce ─────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setShowingMiniForm(false)
    setIsInMiniForm(false)

    if (inputText.trim().length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchProductsByConcept(inputText.trim())
        setSearchResults(results)
        if (results.length > 0) {
          const firstConcept = results[0].concept
          const firstSizeKey = results[0].sizes[0]?.key
          setExpandedConcepts(new Set([firstConcept]))
          if (firstSizeKey) {
            setExpandedSizes(new Set([firstConcept + '||' + firstSizeKey]))
          }
        } else {
          setExpandedConcepts(new Set())
          setExpandedSizes(new Set())
        }
      } catch (e) {
        console.error('search error:', e)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputText])

  // ── Save budget ──────────────────────────────────────────────────────────
  const saveBudget = async () => {
    const amount = parseFloat(budgetInput)
    if (!amount || amount <= 0 || !session?.user.id) return
    setSavingBudget(true)
    try {
      const monthYear = new Date().toISOString().slice(0, 7)
      const { error: upsertError } = await supabase
        .from('budgets')
        .upsert(
          { user_id: session.user.id, month_year: monthYear, monthly_budget: amount },
          { onConflict: 'user_id, month_year' }
        )
      if (upsertError) throw upsertError
      setBudget(amount)
      setBudgetModalVisible(false)
      setBudgetInput('')
    } catch (e: unknown) {
      console.error('[ListScreen] saveBudget error:', e)
    } finally {
      setSavingBudget(false)
    }
  }

  // ── Estimated cost ───────────────────────────────────────────────────────
  const estimatedCost = React.useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.price_at_add) return sum + item.price_at_add * item.quantity
      return sum
    }, 0)
  }, [items])

  // ── Group items by category ──────────────────────────────────────────────
  const groupedSections = React.useMemo(() => {
    const groups: Record<string, GroceryListItem[]> = {}
    items.forEach(item => {
      const cat = item.product?.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length > 0)
      .map(cat => ({ title: cat, data: groups[cat] }))
  }, [items])

  // ── Completion state ─────────────────────────────────────────────────────
  const allChecked = items.length > 0 && items.every(i => i.is_checked)

  // ── Budget helpers ───────────────────────────────────────────────────────
  const budgetProgress = budget && budget > 0 ? Math.min(spentSoFar / budget, 1) : 0
  const budgetRemaining = budget ? Math.max(budget - spentSoFar, 0) : null
  const isOverBudget = budget ? spentSoFar > budget : false

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My List</Text>
            <Text style={styles.headerSub}>Loading...</Text>
          </View>
        </View>
        <Animated.View style={{ opacity: skeletonOpacity }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonLine} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          ))}
        </Animated.View>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My List</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.errorState} onPress={fetchActiveList} activeOpacity={0.7}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Couldn't load your list</Text>
          <Text style={styles.errorSub}>Tap to try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My List</Text>
          <Text style={styles.headerSub}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {items.some(i => i.is_checked) && (
          <TouchableOpacity onPress={clearChecked} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Budget card ── */}
      <View style={styles.budgetCard}>
        {budget ? (
          <>
            <View style={styles.budgetRow}>
              <View style={styles.budgetStat}>
                <Text style={styles.budgetStatLabel}>BUDGET</Text>
                <Text style={styles.budgetStatValue}>${budget.toFixed(0)}</Text>
              </View>
              <View style={styles.budgetDivider} />
              <View style={styles.budgetStat}>
                <Text style={styles.budgetStatLabel}>EST. COST</Text>
                <Text style={styles.budgetStatValue}>
                  {estimatedCost > 0 ? `$${estimatedCost.toFixed(2)}` : '$--'}
                </Text>
              </View>
              <View style={styles.budgetDivider} />
              <View style={styles.budgetStat}>
                <Text style={styles.budgetStatLabel}>SPENT</Text>
                <Text style={[styles.budgetStatValue, isOverBudget && styles.budgetOver]}>
                  ${spentSoFar.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${budgetProgress * 100}%` as `${number}%`,
                    backgroundColor: isOverBudget ? '#F44336' : colors.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetBottomRow}>
              <Text style={styles.budgetRemainingText}>
                {budgetRemaining !== null
                  ? isOverBudget
                    ? `$${(spentSoFar - budget!).toFixed(2)} over budget`
                    : `$${budgetRemaining.toFixed(2)} remaining · ${tripCount} trip${tripCount !== 1 ? 's' : ''}`
                  : ''}
              </Text>
              <TouchableOpacity onPress={() => { setBudgetInput(budget.toFixed(0)); setBudgetModalVisible(true) }}>
                <Text style={styles.budgetEditLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.budgetEmpty}>
            <View style={styles.budgetEmptyLeft}>
              <Text style={styles.budgetEmptyLabel}>GROCERY BUDGET</Text>
              <Text style={styles.budgetEmptyHint}>Set a monthly budget to track spending</Text>
            </View>
            <TouchableOpacity
              style={styles.budgetSetBtn}
              onPress={() => { setBudgetInput(''); setBudgetModalVisible(true) }}
            >
              <Text style={styles.budgetSetBtnText}>Set budget</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── List ── */}
      <SectionList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: keyboardHeight + 100 },
        ]}
        sections={groupedSections}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScrollBeginDrag={() => setDeletingId(null)}
        ListHeaderComponent={
          allChecked ? (
            <View style={styles.completionBanner}>
              <View style={styles.completionLeft}>
                <View style={styles.completionCheck}>
                  <Text style={styles.completionCheckText}>✓</Text>
                </View>
                <View>
                  <Text style={styles.completionTitle}>All done! 🎉</Text>
                  <Text style={styles.completionSub}>Scan receipt to track savings</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.completionBtn}
                onPress={() => router.push('/receipt/upload')}
              >
                <Text style={styles.completionBtnText}>Scan →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: getCategoryColor(section.title) }]} />
            <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.itemCard}
              onLongPress={() => setDeletingId(item.id)}
              onPress={() => {
                if (deletingId === item.id) setDeletingId(null)
              }}
              activeOpacity={0.95}
            >
              {/* Checkbox */}
              <TouchableOpacity onPress={() => handleToggle(item.id)}>
                <Animated.View
                  style={[
                    styles.checkbox,
                    item.is_checked && styles.checkboxChecked,
                    { transform: [{ scale: getCheckAnim(item.id) }] },
                  ]}
                >
                  {item.is_checked && <Text style={styles.checkmark}>✓</Text>}
                </Animated.View>
              </TouchableOpacity>

              {/* Item info */}
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}>
                  {item.custom_item_name || item.product?.name || 'Item'}
                </Text>
                {item.product?.brand && (
                  <Text style={styles.itemSub}>
                    {item.product.brand}
                    {item.unit ? ' · ' + item.unit : ''}
                  </Text>
                )}
                {!item.product?.brand && item.unit && (
                  <Text style={styles.itemSub}>{item.unit}</Text>
                )}
                {item.notes && (
                  <Text style={styles.itemNote}>{item.notes}</Text>
                )}
              </View>

              {/* Qty + price */}
              <View style={styles.itemRight}>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity <= 1) {
                        setDeletingId(item.id)
                      } else {
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    }}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyCount}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemPrice}>{item.product_id ? '$--' : '?'}</Text>
              </View>
            </TouchableOpacity>

            {deletingId === item.id && (
              <View style={styles.deleteRow}>
                <TouchableOpacity
                  style={styles.deleteConfirmBtn}
                  onPress={() => {
                    deleteItem(item.id)
                    setDeletingId(null)
                  }}
                >
                  <Text style={styles.deleteConfirmText}>🗑 Remove item</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteCancelBtn}
                  onPress={() => setDeletingId(null)}
                >
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptySub}>
              Tap "+ Add item to your list" below to start
            </Text>
          </View>
        }
      />

      {/* ── Search results panel ── */}
      {isInputFocused && (
        <View style={[
          styles.resultsPanel,
          {
            bottom: INPUT_BAR_HEIGHT + keyboardHeight,
            maxHeight: screenHeight - keyboardHeight - INPUT_BAR_HEIGHT - 100,
          },
        ]}>

          {/* Drag handle */}
          <View style={styles.resultsDragHandle} />

          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* SEARCHING SKELETON */}
            {searching && (
              <View style={styles.skeletonWrap}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={styles.skeletonRow} />
                ))}
              </View>
            )}

            {/* RESULTS */}
            {!searching && searchResults.length > 0 && (
              searchResults.map(group => {
                const isConceptOpen = expandedConcepts.has(group.concept)
                return (
                <View key={group.concept}>

                  {/* ── MAIN CONCEPT HEADER ── */}
                  <TouchableOpacity
                    style={[
                      styles.conceptHeader,
                      isConceptOpen && styles.conceptHeaderOpen,
                    ]}
                    onPress={() => {
                      if (isConceptOpen) {
                        setExpandedConcepts(new Set())
                        setExpandedSizes(new Set())
                        setSelectedOption(null)
                      } else {
                        setExpandedConcepts(new Set([group.concept]))
                        const firstSizeKey = group.sizes[0]?.key
                        setExpandedSizes(
                          firstSizeKey
                            ? new Set([group.concept + '||' + firstSizeKey])
                            : new Set()
                        )
                        setSelectedOption(null)
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.conceptHeaderContent}>
                      <Text style={styles.conceptTitle}>
                        {group.display_name}
                      </Text>
                      <Text style={styles.conceptSubline}>
                        {group.sizes.length} size{group.sizes.length !== 1 ? 's' : ''}
                        {' · '}from ${Math.min(...group.sizes.map(s => s.best_price)).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.conceptChevron}>
                      {isConceptOpen ? '▴' : '▾'}
                    </Text>
                  </TouchableOpacity>

                  {/* ── SIZE CHIPS + STORE CARDS ── */}
                  {expandedConcepts.has(group.concept) && (
                    <View>

                      {/* Horizontal size chip row */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                        contentContainerStyle={styles.sizeChipsScroll}
                      >
                        {group.sizes.map(size => {
                          const k = group.concept + '||' + size.key
                          const isActive = expandedSizes.has(k)
                          return (
                            <TouchableOpacity
                              key={size.key}
                              style={[styles.sizeChip, isActive && styles.sizeChipActive]}
                              onPress={() => {
                                setExpandedSizes(prev =>
                                  prev.has(k) ? new Set() : new Set([k])
                                )
                                setSelectedOption(null)
                              }}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.sizeChipLabel, isActive && styles.sizeChipLabelActive]}>
                                {size.size_label || size.variant_type}
                              </Text>
                              <Text style={[styles.sizeChipPrice, isActive && styles.sizeChipPriceActive]}>
                                from ${size.best_price.toFixed(2)}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </ScrollView>

                      {/* Store cards for the selected size */}
                      {group.sizes.map(size => {
                        const k = group.concept + '||' + size.key
                        if (!expandedSizes.has(k)) return null
                        return (
                          <View key={size.key} style={styles.storeCardsSection}>

                            {/* Selected size label */}
                            <Text style={styles.storeCardsSectionTitle}>
                              {size.variant_type}{size.size_label ? ` · ${size.size_label}` : ''} — {size.store_options.length} store{size.store_options.length !== 1 ? 's' : ''}
                            </Text>

                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              keyboardShouldPersistTaps="always"
                              contentContainerStyle={styles.storeCardsScroll}
                            >
                              {size.store_options.map(opt => (
                                <TouchableOpacity
                                  key={opt.store_id + opt.product_id}
                                  style={[
                                    styles.storeCard,
                                    opt.is_best && styles.storeCardBest,
                                    selectedOption?.store_id === opt.store_id &&
                                    selectedOption?.product_id === opt.product_id &&
                                      styles.storeCardSelected,
                                  ]}
                                  onPress={() => {
                                    setSelectedOption(
                                      selectedOption?.store_id === opt.store_id &&
                                      selectedOption?.product_id === opt.product_id
                                        ? null : opt
                                    )
                                  }}
                                  activeOpacity={0.8}
                                >
                                  {/* Product image */}
                                  <View style={styles.cardImgBox}>
                                    {opt.image_url ? (
                                      <Image
                                        source={{ uri: opt.image_url }}
                                        style={styles.cardImg}
                                        resizeMode="contain"
                                      />
                                    ) : (
                                      <View style={[
                                        styles.cardImgPlaceholder,
                                        { backgroundColor: getStoreColor(opt.store_chain) + '15' },
                                      ]}>
                                        <View style={[
                                          styles.cardImgCircle,
                                          { backgroundColor: getStoreColor(opt.store_chain) },
                                        ]}>
                                          <Text style={styles.cardImgLetter}>
                                            {(opt.store_brand_name || opt.brand || opt.product_name)
                                              .charAt(0).toUpperCase()}
                                          </Text>
                                        </View>
                                      </View>
                                    )}
                                    {opt.is_best && (
                                      <View style={styles.bestBadge}>
                                        <Text style={styles.bestBadgeText}>BEST</Text>
                                      </View>
                                    )}
                                  </View>

                                  {/* Price */}
                                  <Text style={[styles.cardPrice, opt.is_best && styles.cardPriceBest]}>
                                    ${opt.effective_price.toFixed(2)}
                                  </Text>

                                  {/* Brand */}
                                  <Text style={styles.cardBrand} numberOfLines={1}>
                                    {opt.store_brand_name || opt.brand || 'Store brand'}
                                  </Text>

                                  {/* Store chip */}
                                  <View style={[styles.storeChip, { backgroundColor: getStoreColor(opt.store_chain) }]}>
                                    <Text style={styles.storeChipText}>{opt.store_chain}</Text>
                                  </View>

                                  {/* Loyalty note */}
                                  {opt.has_loyalty && opt.loyalty_price && (
                                    <Text style={styles.cardLoyalty}>w/ {opt.loyalty_name}</Text>
                                  )}

                                  {/* Selected indicator */}
                                  {selectedOption?.store_id === opt.store_id &&
                                   selectedOption?.product_id === opt.product_id && (
                                    <View style={styles.selectedCheck}>
                                      <Text style={styles.selectedCheckText}>✓</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>

                            {/* Add to list row */}
                            <View style={styles.addToListRow}>
                              {addedConfirm ? (
                                <View style={styles.addedConfirmRow}>
                                  <Text style={styles.addedConfirmText}>{addedConfirm}</Text>
                                </View>
                              ) : selectedOption ? (
                                <TouchableOpacity
                                  style={styles.addToListBtn}
                                  onPress={() => {
                                    const msg = `✓ ${selectedOption.store_chain} $${selectedOption.effective_price.toFixed(2)} added!`
                                    addProductToListById(selectedOption.product_id, 1, undefined)
                                    setRecentlyAddedId(selectedOption.product_id)
                                    setSelectedOption(null)
                                    setAddedConfirm(msg)
                                    setTimeout(() => {
                                      setRecentlyAddedId(null)
                                      setAddedConfirm(null)
                                    }, 2000)
                                  }}
                                >
                                  <Text style={styles.addToListBtnText}>
                                    + Add {selectedOption.store_chain} ${selectedOption.effective_price.toFixed(2)} to list
                                  </Text>
                                </TouchableOpacity>
                              ) : (
                                <Text style={styles.addToListHint}>
                                  Tap a card to select, then add
                                </Text>
                              )}
                            </View>
                          </View>
                        )
                      })}
                    </View>
                  )}
                </View>
              )})
            )}

            {/* NO RESULTS */}
            {!searching &&
             searchResults.length === 0 &&
             inputText.trim().length >= 2 &&
             !showingMiniForm && (
              <View style={styles.noResultsWrap}>
                <Svg width={40} height={40} viewBox="0 0 24 24"
                  fill="none" stroke={colors.textTertiary}
                  strokeWidth={1.5} strokeLinecap="round">
                  <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <Line x1="3" y1="6" x2="21" y2="6" />
                  <Path d="M16 10a4 4 0 01-8 0" />
                </Svg>
                <Text style={styles.noResultsTitle}>Still adding products</Text>
                <Text style={styles.noResultsSub}>
                  We add new products every week.{'\n'}
                  You can still add this to your list!
                </Text>
                <TouchableOpacity
                  style={styles.addCustomTrigger}
                  onPress={() => {
                    setIsInMiniForm(true)
                    setMiniFormUnit(getDefaultUnit(inputText.trim()))
                    setShowingMiniForm(true)
                  }}
                >
                  <Text style={styles.addCustomTriggerText}>
                    + Add "{inputText.trim()}" to list
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MINI FORM */}
            {showingMiniForm && (
              <View style={styles.miniFormWrap}>
                <Text style={styles.miniFormTitle}>
                  "{inputText.trim()}"
                </Text>

                {/* Quantity */}
                <View style={styles.miniRow}>
                  <Text style={styles.miniLabel}>QTY</Text>
                  <View style={styles.miniQtyRow}>
                    <TouchableOpacity
                      style={styles.miniQtyBtn}
                      onPress={() => setMiniFormQty(Math.max(1, miniFormQty - 1))}
                    >
                      <Text style={styles.miniQtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.miniQtyNum}>{miniFormQty}</Text>
                    <TouchableOpacity
                      style={styles.miniQtyBtn}
                      onPress={() => setMiniFormQty(miniFormQty + 1)}
                    >
                      <Text style={styles.miniQtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Unit chips */}
                <Text style={styles.miniLabel}>UNIT</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  style={{ marginTop: 6 }}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    gap: 6,
                    flexDirection: 'row',
                  }}
                >
                  {UNIT_OPTIONS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitChip, miniFormUnit === u && styles.unitChipActive]}
                      onPress={() => setMiniFormUnit(u)}
                    >
                      <Text style={[
                        styles.unitChipText,
                        miniFormUnit === u && styles.unitChipTextActive,
                      ]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Note */}
                <TextInput
                  style={styles.miniNote}
                  placeholder="Note (optional)"
                  placeholderTextColor={colors.textTertiary}
                  value={miniFormNote}
                  onChangeText={setMiniFormNote}
                  returnKeyType="done"
                />

                {/* Actions */}
                <View style={styles.miniActions}>
                  <TouchableOpacity
                    style={styles.miniCancel}
                    onPress={() => {
                      setIsInMiniForm(false)
                      setShowingMiniForm(false)
                    }}
                  >
                    <Text style={styles.miniCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.miniAdd}
                    onPress={() => {
                      addCustomItemFull(
                        inputText.trim(),
                        miniFormQty,
                        miniFormUnit,
                        miniFormNote.trim() || undefined
                      )
                      setIsInMiniForm(false)
                      setShowingMiniForm(false)
                      setInputText('')
                      setSearchResults([])
                      Keyboard.dismiss()
                    }}
                  >
                    <Text style={styles.miniAddText}>Add to List</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* MANUAL ADD HINT at bottom */}
            {!searching &&
             inputText.trim().length >= 2 &&
             !showingMiniForm && (
              <TouchableOpacity
                style={styles.manualHint}
                onPress={() => {
                  setIsInMiniForm(true)
                  setMiniFormUnit(getDefaultUnit(inputText.trim()))
                  setShowingMiniForm(true)
                }}
              >
                <Text style={styles.manualHintText}>
                  + Add "{inputText.trim()}" as custom item
                </Text>
              </TouchableOpacity>
            )}

          </ScrollView>
        </View>
      )}

      {/* ── Bottom input bar ── */}
      <View style={[styles.bottomBar, { marginBottom: keyboardHeight }]}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputInner}>
              <SearchIconSVG />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Add item to your list..."
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                returnKeyType="done"
                blurOnSubmit={false}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isInMiniForm) {
                      setIsInputFocused(false)
                      if (inputText.trim().length === 0) {
                        setSearchResults([])
                      }
                    }
                  }, 200)
                }}
                onSubmitEditing={() => {
                  if (inputText.trim().length > 0) {
                    addCustomItemFull(inputText.trim(), 1, getDefaultUnit(inputText.trim()))
                    setInputText('')
                    setSearchResults([])
                    Keyboard.dismiss()
                  }
                }}
              />
            </View>
          </View>
          {isInputFocused && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                Keyboard.dismiss()
                setIsInputFocused(false)
                setIsInMiniForm(false)
                setInputText('')
                setSearchResults([])
                setShowingMiniForm(false)
              }}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Budget modal ── */}
      <Modal
        visible={budgetModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setBudgetModalVisible(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Monthly Budget</Text>
            <TouchableOpacity
              onPress={saveBudget}
              style={[styles.modalSaveBtn, savingBudget && styles.modalSaveBtnDisabled]}
              disabled={savingBudget || !budgetInput.trim()}
            >
              {savingBudget
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.modalSaveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalAmountSection}>
              <Text style={styles.modalAmountLabel}>SET BUDGET</Text>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalDollarSign}>$</Text>
                <TextInput
                  style={styles.modalAmountInput}
                  value={budgetInput}
                  onChangeText={text => setBudgetInput(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor="#C0CCC0"
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
              <View style={styles.modalAmountUnderline} />
            </View>

            <View style={styles.modalPresetsSection}>
              <Text style={styles.modalPresetsLabel}>QUICK SELECT</Text>
              <View style={styles.modalPresetsRow}>
                {BUDGET_PRESETS.map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.presetChip,
                      budgetInput === String(amount) && styles.presetChipSelected,
                    ]}
                    onPress={() => setBudgetInput(String(amount))}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetChipText,
                      budgetInput === String(amount) && styles.presetChipTextSelected,
                    ]}>
                      ${amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(spentSoFar > 0 || tripCount > 0) && (
              <View style={styles.modalSummaryCard}>
                <Text style={styles.modalSummaryTitle}>THIS MONTH SO FAR</Text>
                <View style={styles.modalSummaryRow}>
                  <View style={styles.modalSummaryStat}>
                    <Text style={styles.modalSummaryValue}>${spentSoFar.toFixed(2)}</Text>
                    <Text style={styles.modalSummaryLabel}>spent</Text>
                  </View>
                  <View style={styles.modalSummaryDivider} />
                  <View style={styles.modalSummaryStat}>
                    <Text style={styles.modalSummaryValue}>{tripCount}</Text>
                    <Text style={styles.modalSummaryLabel}>trip{tripCount !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Budget card
  budgetCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetStat: {
    flex: 1,
    alignItems: 'center',
  },
  budgetStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  budgetStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 3,
    letterSpacing: -0.3,
  },
  budgetOver: {
    color: '#F44336',
  },
  budgetDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  budgetBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetRemainingText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  budgetEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  budgetEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetEmptyLeft: {
    flex: 1,
  },
  budgetEmptyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  budgetEmptyHint: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 3,
  },
  budgetSetBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  budgetSetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },

  // Completion banner
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  completionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  completionCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCheckText: {
    fontSize: 18,
    color: colors.textInverse,
    fontWeight: '700',
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  completionSub: {
    fontSize: 12,
    color: '#6B7B7A',
    marginTop: 1,
  },
  completionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 8,
  },
  sectionBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    flex: 1,
  },
  sectionCount: {
    fontSize: 11,
    color: colors.textTertiary,
  },

  // Item cards
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0DAD0',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 13,
    color: colors.textInverse,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#A0B0A0',
  },
  itemSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  itemNote: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  qtyCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  deleteRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
    gap: 8,
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  deleteCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7B7A',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Loading skeletons
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  skeletonContent: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 7,
    width: '70%',
  },
  skeletonLineShort: {
    height: 11,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    width: '40%',
  },

  // Error state
  errorState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 6,
    textAlign: 'center',
  },

  // ── Search results panel ──────────────────────────────────────────────────
  resultsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  resultsDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },

  // Concept header
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    gap: 10,
  },
  conceptHeaderOpen: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  conceptIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  conceptIconLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  conceptAccentBar: {
    width: 4,
    height: 26,
    borderRadius: 3,
  },
  conceptHeaderContent: {
    flex: 1,
    gap: 2,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  conceptSubline: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '400',
  },
  conceptMeta: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  conceptChevron: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Size chips (horizontal row)
  sizeChipsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  sizeChip: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sizeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sizeChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sizeChipLabelActive: {
    color: colors.textInverse,
  },
  sizeChipPrice: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  sizeChipPriceActive: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Store cards section (below chips)
  storeCardsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceTertiary,
  },
  storeCardsSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Keep legacy aliases for safety
  sizeHeader: { flexDirection: 'row', alignItems: 'center' },
  sizeHeaderContent: { flex: 1 },
  sizeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  sizeLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  sizeMeta: { fontSize: 11, color: colors.textTertiary },
  sizeBestPrice: { fontSize: 11, color: colors.textTertiary },
  sizeChevron: { fontSize: 11, color: colors.textTertiary },

  // Horizontal card scroll
  storeCardsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },

  // Individual store card
  storeCard: {
    width: 108,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  storeCardBest: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  storeCardSelected: {
    borderColor: '#2563EB',
    borderWidth: 2.5,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  // Card image area
  cardImgBox: {
    height: 76,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImg: {
    width: 60,
    height: 60,
  },
  cardImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textInverse,
  },
  bestBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  // Card body
  cardPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  cardPriceBest: {
    color: colors.primary,
  },
  cardBrand: {
    fontSize: 10,
    color: colors.textTertiary,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  storeChip: {
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  storeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
    textAlign: 'center',
  },
  cardLoyalty: {
    fontSize: 9,
    color: colors.warning,
    paddingHorizontal: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Add to list row
  addToListRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  addToListBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addToListBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  addToListHint: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  addedConfirmRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingVertical: 11,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
  },
  addedConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // No results
  noResultsWrap: {
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  addCustomTrigger: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addCustomTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  // Mini form
  miniFormWrap: {
    padding: 16,
    gap: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.surfaceSecondary,
  },
  miniFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  miniQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniQtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniQtyBtnText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 24,
  },
  miniQtyNum: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 34,
    textAlign: 'center',
  },
  unitChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitChipTextActive: {
    color: colors.textInverse,
  },
  miniNote: {
    height: 42,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
  },
  miniActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  miniCancel: {
    flex: 1,
    height: 42,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniAdd: {
    flex: 2,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  miniAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
  },

  // Manual hint
  manualHint: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: colors.surfaceSecondary,
  },
  manualHintText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },

  // Skeleton in search panel
  skeletonWrap: { padding: 12, gap: 8 },
  skeletonRow: {
    height: 50,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: colors.background,
    borderRadius: 23,
    paddingHorizontal: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: 46,
  },
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },

  // Budget modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    minWidth: 60,
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.45,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalAmountSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  modalAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  modalDollarSign: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.primary,
    lineHeight: 56,
  },
  modalAmountInput: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 120,
    letterSpacing: -1,
  },
  modalAmountUnderline: {
    height: 2,
    width: 180,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  modalPresetsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  modalPresetsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextSelected: {
    color: colors.textInverse,
  },
  modalSummaryCard: {
    marginHorizontal: 24,
    marginTop: 32,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  modalSummaryStat: {
    alignItems: 'center',
  },
  modalSummaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  modalSummaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
})
