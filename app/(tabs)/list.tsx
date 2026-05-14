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
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { useListStore } from '../../stores/listStore'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStoreColor = (chain: string): string => {
  const map: Record<string, string> = {
    'ShopRite':    '#CC0000',
    'Stop & Shop': '#007A3D',
    'Aldi':        '#1E3A5F',
    'BJs':         '#0047AB',
    'Costco':      '#005DAA',
    'Walmart':     '#0071CE',
    'Target':      '#E53935',
  }
  return map[chain] || '#475569'
}

const CATEGORY_ORDER = [
  'produce', 'dairy', 'meat', 'bakery',
  'beverages', 'frozen', 'pantry', 'household', 'deli', 'other',
]

const CATEGORY_COLORS: Record<string, string> = {
  produce:   '#00A651',
  dairy:     '#2563EB',
  meat:      '#EF4444',
  bakery:    '#F97316',
  beverages: '#06B6D4',
  frozen:    '#8B5CF6',
  pantry:    '#78716C',
  household: '#64748B',
  deli:      '#F97316',
  other:     '#94A3B8',
}

const BUDGET_PRESETS = [100, 150, 200, 250, 300, 400]

const UNIT_OPTIONS = [
  'each', 'pack', 'lb', 'oz',
  'gallon', 'bottle', 'bag',
  'box', 'can', 'bunch', 'dozen', 'pint',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { session, isGuest } = useAuthStore()
  const listRefreshKey = useListStore(state => state.listRefreshKey)
  const {
    items,
    loading,
    error,
    isShared,
    toggleChecked,
    updateQuantity,
    updateItem,
    deleteItem,
    clearChecked,
    fetchActiveList,
    addCustomItemFull,
    addProductToListById,
    completeTrip,
    fetchLastCompletedItems,
    repeatLastList,
  } = useList()

  // ── Input / search state ──────────────────────────────────────────────────
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
  const INPUT_BAR_HEIGHT = 72

  // ── Mini form state ───────────────────────────────────────────────────────
  const [showingMiniForm, setShowingMiniForm] = useState(false)
  const [isInMiniForm, setIsInMiniForm] = useState(false)
  const [miniFormQty, setMiniFormQty] = useState(1)
  const [miniFormUnit, setMiniFormUnit] = useState('each')
  const [miniFormNote, setMiniFormNote] = useState('')

  // ── New list UI toggle ────────────────────────────────────────────────────
  const USE_NEW_LIST_UI = true
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [inlineUnit, setInlineUnit] = useState('each')
  const [inlineNote, setInlineNote] = useState('')

  const openInline = (item: GroceryListItem) => {
    if (expandedItemId === item.id) {
      setExpandedItemId(null)
    } else {
      setInlineUnit(item.unit ?? 'each')
      setInlineNote(item.notes ?? '')
      setExpandedItemId(item.id)
    }
  }

  const saveInline = async (item: GroceryListItem) => {
    await updateItem(item.id, {
      quantity: item.quantity,
      unit: inlineUnit || null,
      notes: inlineNote.trim() || null,
    })
    setExpandedItemId(null)
  }

  // ── Edit item modal state ─────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<GroceryListItem | null>(null)
  const [editQty, setEditQty] = useState(1)
  const [editUnit, setEditUnit] = useState('each')
  const [editNote, setEditNote] = useState('')

  const openEditModal = (item: GroceryListItem) => {
    setEditQty(item.quantity)
    setEditUnit(item.unit ?? 'each')
    setEditNote(item.notes ?? '')
    setEditingItem(item)
  }

  const saveEditModal = async () => {
    if (!editingItem) return
    await updateItem(editingItem.id, {
      quantity: editQty,
      unit: editUnit || null,
      notes: editNote.trim() || null,
    })
    setEditingItem(null)
  }

  // ── Repeat last list state ────────────────────────────────────────────────
  const [lastListItems, setLastListItems] = useState<{
    product_id: string | null
    custom_item_name: string | null
    quantity: number
    unit: string | null
    notes: string | null
    price_at_add: number | null
    product_name: string | null
    category: string | null
  }[]>([])
  const [lastListDate, setLastListDate] = useState<string | null>(null)
  const [repeatModalVisible, setRepeatModalVisible] = useState(false)
  const [repeatChecked, setRepeatChecked] = useState<Set<number>>(new Set())
  const [repeating, setRepeating] = useState(false)
  const [completingTrip, setCompletingTrip] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastAnim = useRef(new Animated.Value(0)).current

  const showToast = (msg: string) => {
    setToastMessage(msg)
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMessage(null))
  }

  const openRepeatModal = () => {
    // Pre-check all items
    setRepeatChecked(new Set(lastListItems.map((_, i) => i)))
    setRepeatModalVisible(true)
  }

  const handleRepeat = async () => {
    const selected = lastListItems.filter((_, i) => repeatChecked.has(i))
    if (selected.length === 0) return
    setRepeating(true)
    const count = await repeatLastList(selected)
    setRepeating(false)
    setRepeatModalVisible(false)
    if (count > 0) showToast(t('list.toastItemsAdded', { count }))
  }

  const handleCompleteTrip = async () => {
    setCompletingTrip(true)
    const ok = await completeTrip()
    setCompletingTrip(false)
    if (ok) {
      // Refresh last completed items so repeat works immediately next session
      const result = await fetchLastCompletedItems()
      if (result) { setLastListItems(result.items); setLastListDate(result.date) }
      showToast(t('list.toastTripComplete'))
    }
  }

  // ── Checkbox animations ───────────────────────────────────────────────────
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

  // ── Skeleton pulse ────────────────────────────────────────────────────────
  const skeletonOpacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Budget state ──────────────────────────────────────────────────────────
  const [budget, setBudget] = useState<number | null>(null)
  const [spentSoFar, setSpentSoFar] = useState(0)
  const [tripCount, setTripCount] = useState(0)
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  // ── Fetch list on mount + whenever household membership changes ───────────
  useEffect(() => {
    if (!isGuest) fetchActiveList()
  }, [listRefreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch last completed list for repeat feature ──────────────────────────
  useEffect(() => {
    if (isGuest) return
    fetchLastCompletedItems().then(result => {
      if (result) {
        setLastListItems(result.items)
        setLastListDate(result.date)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch budget on mount ─────────────────────────────────────────────────
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

  // ── Keyboard listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const showSub = Keyboard.addListener(
      'keyboardWillShow',
      (e: KeyboardEvent) => setKeyboardHeight(e.endCoordinates.height)
    )
    const hideSub = Keyboard.addListener(
      'keyboardWillHide',
      () => setKeyboardHeight(0)
    )
    return () => { showSub.remove(); hideSub.remove() }
  }, [])

  // ── Search with debounce ──────────────────────────────────────────────────
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
          const firstSize = results[0].sizes[0]
          setExpandedConcepts(new Set([firstConcept]))
          if (firstSize) {
            setExpandedSizes(new Set([firstConcept + '||' + firstSize.key]))
            const best = firstSize.store_options.find(o => o.is_best) ?? firstSize.store_options[0] ?? null
            setSelectedOption(best)
          }
        } else {
          setExpandedConcepts(new Set())
          setExpandedSizes(new Set())
          setSelectedOption(null)
        }
      } catch (e) {
        console.error('search error:', e)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [inputText])

  // ── Save budget ───────────────────────────────────────────────────────────
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

  // ── Animated progress bar ─────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(1)).current

  // ── List metrics ──────────────────────────────────────────────────────────
  const {
    estimatedCost,
    inCartCost,
    checkedCount,
    uncheckedCount,
    pricedCount,
  } = React.useMemo(() => {
    const checked = items.filter(i => i.is_checked)
    const unchecked = items.filter(i => !i.is_checked)
    return {
      estimatedCost: unchecked.reduce((s, i) => s + (i.price_at_add ?? 0) * i.quantity, 0),
      inCartCost: checked.reduce((s, i) => s + (i.price_at_add ?? 0) * i.quantity, 0),
      checkedCount: checked.length,
      uncheckedCount: unchecked.length,
      pricedCount: items.filter(i => i.price_at_add != null).length,
    }
  }, [items])

  // ── Animate progress bar when cost or budget changes ─────────────────────
  useEffect(() => {
    const active = checkedCount > 0 ? inCartCost : estimatedCost
    const target = budget && budget > 0 ? Math.min(active / budget, 1) : 0
    Animated.spring(progressAnim, {
      toValue: target,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start()
  }, [estimatedCost, inCartCost, budget, checkedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fade numbers when key values change ───────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1,   duration: 180, useNativeDriver: true }),
    ]).start()
  }, [estimatedCost, inCartCost, checkedCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Group items by category ───────────────────────────────────────────────
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

  const allChecked = items.length > 0 && items.every(i => i.is_checked)
  const isShopping = checkedCount > 0 && !allChecked
  const activeAmount = isShopping ? inCartCost : estimatedCost
  const budgetRemaining = budget ? Math.max(budget - activeAmount, 0) : null
  const isOverBudget = budget ? activeAmount > budget : false
  const progressRatio = budget && budget > 0 ? Math.min(activeAmount / budget, 1) : 0
  const progressColor = progressRatio > 0.9 ? '#FCA5A5' : progressRatio > 0.7 ? '#FCD34D' : 'rgba(255,255,255,0.9)'

  // ─────────────────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroSkeleton}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>{t('list.heroTitle')}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.sheetContainer}>
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
        </View>
      </View>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroSkeleton}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>{t('list.heroTitle')}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.sheetContainer}>
          <TouchableOpacity style={styles.errorState} onPress={fetchActiveList} activeOpacity={0.7}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>{t('list.couldntLoad')}</Text>
            <Text style={styles.errorSub}>{t('list.tapToRetry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

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

            {/* ── Top row: label + clear button ── */}
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroLabel}>{t('list.heroLabel')}</Text>
                <View style={styles.heroTitleRow}>
                  <Text style={styles.heroTitle}>
                    {isShopping ? t('list.inCart', { checked: checkedCount, total: items.length }) : t('list.heroTitle')}
                  </Text>
                  {isShared && (
                    <View style={styles.sharedPill}>
                      <Text style={styles.sharedPillText}>👥 Shared</Text>
                    </View>
                  )}
                </View>
              </View>
              {checkedCount > 0 && (
                <TouchableOpacity onPress={clearChecked} style={styles.heroClearBtn}>
                  <Text style={styles.heroClearText}>{t('list.clearDone')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Summary card ── */}
            <View style={styles.summaryCard}>

              {/* Big amount */}
              <Animated.View style={[styles.summaryAmountRow, { opacity: fadeAnim }]}>
                <View style={styles.summaryAmountLeft}>
                  <Text style={styles.summaryAmountLabel}>
                    {isShopping ? t('list.spentSoFar') : t('list.estimatedCost')}
                  </Text>
                  <Text style={[styles.summaryAmount, isOverBudget && styles.summaryAmountOver]}>
                    {activeAmount > 0
                      ? `$${activeAmount.toFixed(2)}`
                      : pricedCount === 0 && items.length > 0
                        ? '$—'
                        : '$0.00'}
                  </Text>
                  {isShopping && uncheckedCount > 0 && estimatedCost > 0 && (
                    <Text style={styles.summarySubAmount}>
                      +~${estimatedCost.toFixed(2)} still in list
                    </Text>
                  )}
                </View>

                {/* Stat pills stacked right */}
                <View style={styles.summaryPills}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillValue}>{items.length}</Text>
                    <Text style={styles.summaryPillLabel}>{t('list.items')}</Text>
                  </View>
                  {checkedCount > 0 && (
                    <View style={[styles.summaryPill, styles.summaryPillGreen]}>
                      <Text style={[styles.summaryPillValue, styles.summaryPillValueGreen]}>{checkedCount}</Text>
                      <Text style={[styles.summaryPillLabel, styles.summaryPillLabelGreen]}>{t('list.done')}</Text>
                    </View>
                  )}
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillValue}>{pricedCount}/{items.length}</Text>
                    <Text style={styles.summaryPillLabel}>{t('list.priced')}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Divider */}
              <View style={styles.summaryDivider} />

              {/* Progress bar + budget row */}
              <TouchableOpacity
                style={styles.summaryBudgetRow}
                onPress={() => { setBudgetInput(budget ? budget.toFixed(0) : ''); setBudgetModalVisible(true) }}
                activeOpacity={0.7}
              >
                <View style={styles.summaryBudgetLeft}>
                  {budget ? (
                    <>
                      <View style={styles.summaryBarTrack}>
                        <Animated.View style={[
                          styles.summaryBarFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: isOverBudget ? '#FCA5A5'
                              : progressRatio > 0.75 ? '#FCD34D'
                              : 'rgba(255,255,255,0.9)',
                          },
                        ]} />
                      </View>
                      <Text style={[styles.summaryBudgetText, isOverBudget && styles.summaryBudgetTextOver]}>
                        {isOverBudget
                          ? `$${(activeAmount - budget).toFixed(2)} over $${budget.toFixed(0)} budget`
                          : `$${budgetRemaining?.toFixed(2)} left of $${budget.toFixed(0)} budget`}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.summaryBudgetCta}>{t('list.setBudgetCta')}</Text>
                  )}
                </View>
                <View style={styles.summaryEditBtn}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Svg>
                </View>
              </TouchableOpacity>

            </View>

          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── WHITE SHEET ── */}
      <View style={styles.sheetContainer}>

        {/* Completion banner */}
        {allChecked && (
          <View style={styles.completionBanner}>
            {/* Top row: icon + text */}
            <View style={styles.completionTop}>
              <View style={styles.completionCheck}>
                <Text style={styles.completionCheckText}>✓</Text>
              </View>
              <View style={styles.completionTextCol}>
                <Text style={styles.completionTitle}>{t('list.allDone')}</Text>
                <Text style={styles.completionSub}>{t('list.allDoneSub')}</Text>
              </View>
            </View>
            {/* Action buttons */}
            <View style={styles.completionActions}>
              <TouchableOpacity
                style={[styles.completionDoneBtn, completingTrip && { opacity: 0.6 }]}
                onPress={handleCompleteTrip}
                disabled={completingTrip}
                activeOpacity={0.85}
              >
                {completingTrip
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.completionDoneBtnText}>{t('list.doneShopping')}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completionScanBtn}
                onPress={() => router.push('/receipt/upload')}
              >
                <Text style={styles.completionScanBtnText}>{t('list.scanReceipt')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

          {/* Where to shop entry card */}
          {uncheckedCount >= 3 && pricedCount >= 3 && !allChecked && (
            <TouchableOpacity
              style={styles.whereToShopWrap}
              onPress={() => router.push('/where-to-shop')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.whereToShopCard}
              >
                {/* Decorative circle */}
                <View style={styles.whereToShopCircle} />

                <View style={styles.whereToShopLeft}>
                  <View style={styles.whereToShopIconWrap}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                      stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <Path d="M9 22V12h6v10" />
                    </Svg>
                  </View>
                  <View style={styles.whereToShopText}>
                    <Text style={styles.whereToShopLabel}>{t('list.priceComparison')}</Text>
                    <Text style={styles.whereToShopTitle}>{t('list.whereToShop')}</Text>
                    <Text style={styles.whereToShopSub}>
                      {t('list.whereToShopSub', { count: pricedCount })}
                    </Text>
                  </View>
                </View>

                <View style={styles.whereToShopArrow}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                    stroke="rgba(255,255,255,0.8)" strokeWidth={2.5} strokeLinecap="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

        {/* ── SECTION LIST ── */}
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
          renderSectionHeader={({ section }) => (
            USE_NEW_LIST_UI ? (
              <View style={styles.v2SectionHeader}>
                <View style={[styles.v2SectionDot, { backgroundColor: CATEGORY_COLORS[section.title] || colors.textTertiary }]} />
                <Text style={styles.v2SectionTitle}>{section.title.toUpperCase()}</Text>
                <View style={styles.v2SectionLine} />
                <Text style={styles.v2SectionCount}>{section.data.length}</Text>
              </View>
            ) : (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: CATEGORY_COLORS[section.title] || colors.textTertiary }]} />
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                <Text style={styles.sectionCount}>{section.data.length}</Text>
              </View>
            )
          )}
          renderItem={({ item }) => {
            const accentColor = CATEGORY_COLORS[item.product?.category || 'other'] || colors.textTertiary
            const sizeLabel = item.unit
            const brand = item.product?.brand ?? null
            const detailParts = [sizeLabel, brand].filter(Boolean)
            const detailLine = detailParts.join(' · ')
            const priceDisplay = item.price_at_add != null
              ? `$${Number(item.price_at_add).toFixed(2)}`
              : null
            const isExpanded = expandedItemId === item.id

            if (USE_NEW_LIST_UI) {
              return (
                <View key={item.id} style={styles.v2ItemWrap}>

                  {/* ── Main row ── */}
                  <TouchableOpacity
                    style={styles.v2Row}
                    onPress={() => openInline(item)}
                    activeOpacity={0.7}
                  >
                    {/* Circle checkbox */}
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
                      style={styles.v2CheckWrap}
                    >
                      <Animated.View style={[
                        styles.v2Circle,
                        item.is_checked && { backgroundColor: accentColor, borderColor: accentColor },
                        !item.is_checked && { borderColor: accentColor },
                        { transform: [{ scale: getCheckAnim(item.id) }] },
                      ]}>
                        {item.is_checked && (
                          <Svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                            <Path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth={2.2}
                              strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </Animated.View>
                    </TouchableOpacity>

                    {/* Name + subtitle */}
                    <View style={styles.v2ItemBody}>
                      <Text style={[styles.v2ItemName, item.is_checked && styles.v2ItemNameChecked]}
                        numberOfLines={1}>
                        {item.custom_item_name || item.product?.name || 'Item'}
                      </Text>
                      {(!!detailLine || !!item.notes) && (
                        <Text style={styles.v2ItemSub} numberOfLines={1}>
                          {[detailLine, item.notes ? `"${item.notes}"` : null].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>

                    {/* Right: qty badge + price */}
                    <View style={styles.v2ItemRight}>
                      {item.quantity > 1 && (
                        <View style={styles.v2QtyBadge}>
                          <Text style={styles.v2QtyBadgeText}>{item.quantity}×</Text>
                        </View>
                      )}
                      {priceDisplay && (
                        <Text style={[styles.v2Price, item.is_checked && styles.v2PriceChecked]}>
                          {priceDisplay}
                        </Text>
                      )}
                      {/* Chevron */}
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                        stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round">
                        <Path d={isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                      </Svg>
                    </View>
                  </TouchableOpacity>

                  {/* ── Inline expanded panel ── */}
                  {isExpanded && (
                    <View style={styles.v2Expanded}>

                      {/* Quantity stepper */}
                      <View style={styles.v2ExpandRow}>
                        <Text style={styles.v2ExpandLabel}>{t('list.quantity')}</Text>
                        <View style={styles.v2Stepper}>
                          <TouchableOpacity
                            style={styles.v2StepBtn}
                            onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={styles.v2StepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.v2StepCount}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.v2StepBtn}
                            onPress={() => updateQuantity(item.id, item.quantity + 1)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={styles.v2StepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Unit picker */}
                      <View style={styles.v2ExpandRow}>
                        <Text style={styles.v2ExpandLabel}>{t('list.unit')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                          style={styles.v2UnitScroll} contentContainerStyle={styles.v2UnitScrollContent}>
                          {UNIT_OPTIONS.map(u => (
                            <TouchableOpacity
                              key={u}
                              style={[styles.v2UnitChip, inlineUnit === u && styles.v2UnitChipActive]}
                              onPress={() => setInlineUnit(u)}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.v2UnitChipText, inlineUnit === u && styles.v2UnitChipTextActive]}>
                                {u}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Note input */}
                      <View style={styles.v2ExpandRow}>
                        <Text style={styles.v2ExpandLabel}>{t('list.note')}</Text>
                        <TextInput
                          style={styles.v2NoteInput}
                          value={inlineNote}
                          onChangeText={setInlineNote}
                          placeholder={t('list.notePlaceholder')}
                          placeholderTextColor={colors.textTertiary}
                          returnKeyType="done"
                          onSubmitEditing={() => saveInline(item)}
                        />
                      </View>

                      {/* Action row: Save + Delete */}
                      <View style={styles.v2ActionRow}>
                        <TouchableOpacity
                          style={styles.v2DeleteBtn}
                          onPress={() => { deleteItem(item.id); setExpandedItemId(null) }}
                          activeOpacity={0.75}
                        >
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                            stroke={colors.red} strokeWidth={2}
                            strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </Svg>
                          <Text style={styles.v2DeleteBtnText}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.v2SaveBtn}
                          onPress={() => saveInline(item)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.v2SaveBtnText}>{t('common.save')}</Text>
                        </TouchableOpacity>
                      </View>

                    </View>
                  )}

                  {/* Separator */}
                  <View style={styles.v2Separator} />
                </View>
              )
            }

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, item.is_checked && styles.itemCardChecked]}
                onPress={() => openEditModal(item)}
                activeOpacity={0.92}
              >
                {/* Category accent bar */}
                <View style={[styles.itemAccent, { backgroundColor: accentColor }]} />

                {/* Checkbox */}
                <TouchableOpacity
                  onPress={() => handleToggle(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                >
                  <Animated.View style={[
                    styles.checkbox,
                    item.is_checked && styles.checkboxChecked,
                    { transform: [{ scale: getCheckAnim(item.id) }] },
                  ]}>
                    {item.is_checked && (
                      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <Path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth={2}
                          strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </Animated.View>
                </TouchableOpacity>

                {/* Item info */}
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, item.is_checked && styles.itemNameChecked]}
                    numberOfLines={1}>
                    {item.custom_item_name || item.product?.name || 'Item'}
                  </Text>
                  {!!detailLine && (
                    <Text style={styles.itemSub} numberOfLines={1}>{detailLine}</Text>
                  )}
                  {!!item.notes && (
                    <Text style={styles.itemNote} numberOfLines={1}>"{item.notes}"</Text>
                  )}
                </View>

                {/* Right side: price + qty stepper + delete */}
                <View style={styles.itemRight}>
                  {priceDisplay && (
                    <Text style={styles.itemPriceReal}>{priceDisplay}</Text>
                  )}
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 4 }}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyCount}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => deleteItem(item.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
                    >
                      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                        stroke={colors.textTertiary} strokeWidth={2}
                        strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>🛒</Text>
              </View>
              <Text style={styles.emptyTitle}>{t('list.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('list.emptySub')}</Text>
              {lastListItems.length > 0 && (
                <TouchableOpacity
                  style={styles.repeatBtn}
                  onPress={openRepeatModal}
                  activeOpacity={0.8}
                >
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                    stroke={colors.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M1 4v6h6M23 20v-6h-6" />
                    <Path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
                  </Svg>
                  <Text style={styles.repeatBtnText}>{t('list.addFromLastTrip')}</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* ── SEARCH RESULTS PANEL ── */}
      {isInputFocused && (
        <View style={[
          styles.resultsPanel,
          {
            bottom: INPUT_BAR_HEIGHT + keyboardHeight,
            top: insets.top + 8,
          },
        ]}>
          <View style={styles.resultsDragHandle} />

          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Searching skeleton */}
            {searching && (
              <View style={styles.skeletonWrap}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={styles.skeletonRow} />
                ))}
              </View>
            )}

            {/* Results */}
            {!searching && searchResults.length > 0 && (
              searchResults.map(group => {
                const isConceptOpen = expandedConcepts.has(group.concept)
                return (
                  <View key={group.concept}>

                    {/* Concept header */}
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
                          const firstSize = group.sizes[0]
                          if (firstSize) {
                            setExpandedSizes(new Set([group.concept + '||' + firstSize.key]))
                            const best = firstSize.store_options.find(o => o.is_best) ?? firstSize.store_options[0] ?? null
                            setSelectedOption(best)
                          } else {
                            setExpandedSizes(new Set())
                            setSelectedOption(null)
                          }
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.conceptIconBadge,
                        isConceptOpen && styles.conceptIconBadgeOpen,
                      ]}>
                        <Text style={[
                          styles.conceptIconLetter,
                          isConceptOpen && styles.conceptIconLetterOpen,
                        ]}>
                          {group.display_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.conceptHeaderContent}>
                        <Text style={[
                          styles.conceptTitle,
                          isConceptOpen && styles.conceptTitleOpen,
                        ]}>
                          {group.display_name}
                        </Text>
                        <Text style={styles.conceptSubline}>
                          {group.sizes.length} option{group.sizes.length !== 1 ? 's' : ''}
                          {' · '}from ${Math.min(...group.sizes.map(s => s.best_price)).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.conceptChevron,
                        isConceptOpen && styles.conceptChevronOpen,
                      ]}>
                        {isConceptOpen ? '▴' : '▾'}
                      </Text>
                    </TouchableOpacity>

                    {/* Size chips + store cards */}
                    {isConceptOpen && (
                      <View style={styles.conceptBody}>

                        {/* Horizontal size chips */}
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
                                  if (expandedSizes.has(k)) {
                                    setExpandedSizes(new Set())
                                    setSelectedOption(null)
                                  } else {
                                    setExpandedSizes(new Set([k]))
                                    const best = size.store_options.find(o => o.is_best) ?? size.store_options[0] ?? null
                                    setSelectedOption(best)
                                  }
                                }}
                                activeOpacity={0.75}
                              >
                                <Text style={[styles.sizeChipLabel, isActive && styles.sizeChipLabelActive]}>
                                  {size.variant_type && size.variant_type.toLowerCase() !== group.concept.toLowerCase()
                                    ? `${size.variant_type}${size.size_label ? ' · ' + size.size_label : ''}`
                                    : (size.size_label || size.variant_type)}
                                </Text>
                                <Text style={[styles.sizeChipPrice, isActive && styles.sizeChipPriceActive]}>
                                  from ${size.best_price.toFixed(2)}
                                </Text>
                              </TouchableOpacity>
                            )
                          })}
                        </ScrollView>

                        {/* Store cards for selected size */}
                        {group.sizes.map(size => {
                          const k = group.concept + '||' + size.key
                          if (!expandedSizes.has(k)) return null
                          return (
                            <View key={size.key} style={styles.storeCardsSection}>
                              <Text style={styles.storeCardsSectionTitle}>
                                {size.variant_type}{size.size_label ? ` · ${size.size_label}` : ''}
                                {' — '}{size.store_options.length} store{size.store_options.length !== 1 ? 's' : ''}
                              </Text>

                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyboardShouldPersistTaps="always"
                                contentContainerStyle={styles.storeCardsScroll}
                              >
                                {size.store_options.map(opt => {
                                  const isSelected =
                                    selectedOption?.store_id === opt.store_id &&
                                    selectedOption?.product_id === opt.product_id
                                  return (
                                    <TouchableOpacity
                                      key={opt.store_id + opt.product_id}
                                      style={[
                                        styles.storeCard,
                                        opt.is_best && styles.storeCardBest,
                                        isSelected && styles.storeCardSelected,
                                      ]}
                                      onPress={() => setSelectedOption(isSelected ? null : opt)}
                                      activeOpacity={0.8}
                                    >
                                      {/* Image / placeholder */}
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
                                            { backgroundColor: getStoreColor(opt.store_chain) + '18' },
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
                                      <Text style={[
                                        styles.cardPrice,
                                        opt.is_best && styles.cardPriceBest,
                                        isSelected && styles.cardPriceSelected,
                                      ]}>
                                        ${opt.effective_price.toFixed(2)}
                                      </Text>

                                      {/* Brand */}
                                      <Text style={styles.cardBrand} numberOfLines={1}>
                                        {opt.store_brand_name || opt.brand || t('list.storeBrand')}
                                      </Text>

                                      {/* Store chip */}
                                      <View style={[
                                        styles.storeChip,
                                        { backgroundColor: getStoreColor(opt.store_chain) },
                                      ]}>
                                        <Text style={styles.storeChipText}>{opt.store_chain}</Text>
                                      </View>

                                      {/* Loyalty */}
                                      {opt.has_loyalty && opt.loyalty_price && (
                                        <Text style={styles.cardLoyalty}>
                                          w/ {opt.loyalty_name}
                                        </Text>
                                      )}

                                      {/* Selected check */}
                                      {isSelected && (
                                        <View style={styles.selectedCheck}>
                                          <Text style={styles.selectedCheckText}>✓</Text>
                                        </View>
                                      )}
                                    </TouchableOpacity>
                                  )
                                })}
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
                                      const msg = `✓ ${selectedOption.store_chain} · $${selectedOption.effective_price.toFixed(2)} added`
                                      addProductToListById(
                                        selectedOption.product_id,
                                        1,
                                        selectedOption.size_label || undefined,
                                        selectedOption.effective_price,
                                      )
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
                                      {t('list.addStoreToList', { store: selectedOption.store_chain, price: selectedOption.effective_price.toFixed(2) })}
                                    </Text>
                                  </TouchableOpacity>
                                ) : (
                                  <Text style={styles.addToListHint}>
                                    {t('list.tapToSelect')}
                                  </Text>
                                )}
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                )
              })
            )}

            {/* No results */}
            {!searching &&
             searchResults.length === 0 &&
             inputText.trim().length >= 2 &&
             !showingMiniForm && (
              <View style={styles.noResultsWrap}>
                <View style={styles.noResultsIconWrap}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
                    stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <Line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={2.5} />
                  </Svg>
                </View>
                <Text style={styles.noResultsTitle}>"{inputText.trim()}"</Text>
                <Text style={styles.noResultsSub}>{t('list.notTracking')}</Text>
                <TouchableOpacity
                  style={styles.addCustomTrigger}
                  onPress={() => {
                    setMiniFormQty(1)
                    setMiniFormUnit(getDefaultUnit(inputText.trim()))
                    setMiniFormNote('')
                    setIsInMiniForm(true)
                    setShowingMiniForm(true)
                  }}
                >
                  <Text style={styles.addCustomTriggerText}>{t('list.addToMyList')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mini form */}
            {showingMiniForm && (
              <View style={styles.miniFormWrap}>
                {/* Item name pill */}
                <View style={styles.miniItemPill}>
                  <View style={styles.miniItemPillDot} />
                  <Text style={styles.miniItemPillText} numberOfLines={1}>
                    {inputText.trim()}
                  </Text>
                </View>

                {/* Qty + Unit card */}
                <View style={styles.miniCard}>
                  {/* Qty row */}
                  <View style={styles.miniCardRow}>
                    <Text style={styles.miniCardLabel}>{t('list.quantity')}</Text>
                    <View style={styles.miniQtyStepper}>
                      <TouchableOpacity
                        style={styles.miniStepBtn}
                        onPress={() => setMiniFormQty(Math.max(1, miniFormQty - 1))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.miniStepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.miniStepNum}>{miniFormQty}</Text>
                      <TouchableOpacity
                        style={styles.miniStepBtn}
                        onPress={() => setMiniFormQty(miniFormQty + 1)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.miniStepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.miniCardDivider} />

                  {/* Unit chips */}
                  <View style={styles.miniCardRow}>
                    <Text style={styles.miniCardLabel}>{t('list.unit')}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    contentContainerStyle={styles.unitChipsScroll}
                  >
                    {UNIT_OPTIONS.map(u => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, miniFormUnit === u && styles.unitChipActive]}
                        onPress={() => setMiniFormUnit(u)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.unitChipText, miniFormUnit === u && styles.unitChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Note input card */}
                <View style={styles.miniNoteCard}>
                  <Text style={styles.miniCardLabel}>{t('list.note')}</Text>
                  <TextInput
                    style={styles.miniNote}
                    placeholder={t('list.notePlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    value={miniFormNote}
                    onChangeText={setMiniFormNote}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}

            {/* Manual add hint — only shown when there ARE results */}
            {!searching &&
             searchResults.length > 0 &&
             inputText.trim().length >= 2 &&
             !showingMiniForm && (
              <TouchableOpacity
                style={styles.manualHint}
                onPress={() => {
                  setMiniFormQty(1)
                  setMiniFormUnit(getDefaultUnit(inputText.trim()))
                  setMiniFormNote('')
                  setIsInMiniForm(true)
                  setShowingMiniForm(true)
                }}
              >
                <Text style={styles.manualHintText}>
                  {t('list.addManual', { name: inputText.trim() })}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Pinned Add to List button — only shown in mini form */}
          {showingMiniForm && (
            <View style={styles.miniPinnedBtn}>
              <TouchableOpacity
                style={styles.miniPinnedBtnInner}
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
                activeOpacity={0.85}
              >
                <Text style={styles.miniPinnedBtnText}>
                  {miniFormQty > 1
                    ? t('list.addToListMulti', { qty: miniFormQty, name: inputText.trim() })
                    : t('list.addToListSingle', { name: inputText.trim() })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── BOTTOM INPUT BAR ── */}
      <View style={[styles.bottomBar, { marginBottom: keyboardHeight }]}>
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputInner}>
              <SearchIconSVG />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={t('list.addItemPlaceholder')}
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
                      if (inputText.trim().length === 0) setSearchResults([])
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
              style={styles.backBtn}
              onPress={() => {
                Keyboard.dismiss()
                setIsInputFocused(false)
                setIsInMiniForm(false)
                setSelectedOption(null)
                setInputText('')
                setSearchResults([])
                setShowingMiniForm(false)
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                stroke={colors.textSecondary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 19V5M5 12l7 7 7-7" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── BUDGET MODAL ── */}
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
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('list.monthlyBudget')}</Text>
            <TouchableOpacity
              onPress={saveBudget}
              style={[styles.modalSaveBtn, savingBudget && styles.modalSaveBtnDisabled]}
              disabled={savingBudget || !budgetInput.trim()}
            >
              {savingBudget
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.modalSaveText}>{t('common.save')}</Text>
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
              <Text style={styles.modalAmountLabel}>{t('list.setBudgetLabel')}</Text>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalDollarSign}>$</Text>
                <TextInput
                  style={styles.modalAmountInput}
                  value={budgetInput}
                  onChangeText={text => setBudgetInput(text.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                />
              </View>
              <View style={styles.modalAmountUnderline} />
            </View>

            <View style={styles.modalPresetsSection}>
              <Text style={styles.modalPresetsLabel}>{t('list.quickSelect')}</Text>
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
                <Text style={styles.modalSummaryTitle}>{t('list.thisMonthSoFar')}</Text>
                <View style={styles.modalSummaryRow}>
                  <View style={styles.modalSummaryStat}>
                    <Text style={styles.modalSummaryValue}>${spentSoFar.toFixed(2)}</Text>
                    <Text style={styles.modalSummaryLabel}>{t('list.spent')}</Text>
                  </View>
                  <View style={styles.modalSummaryDivider} />
                  <View style={styles.modalSummaryStat}>
                    <Text style={styles.modalSummaryValue}>{tripCount}</Text>
                    <Text style={styles.modalSummaryLabel}>{t('list.trips', { count: tripCount })}</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── EDIT ITEM MODAL ── */}
      <Modal
        visible={editingItem !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingItem(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setEditingItem(null)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('list.editItem')}</Text>
            <TouchableOpacity
              onPress={saveEditModal}
              style={styles.modalSaveBtn}
            >
              <Text style={styles.modalSaveText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.editModalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Item name pill */}
            <View style={styles.miniItemPill}>
              <View style={styles.miniItemPillDot} />
              <Text style={styles.miniItemPillText} numberOfLines={1}>
                {editingItem?.custom_item_name || editingItem?.product?.name || ''}
              </Text>
            </View>

            {/* Qty + Unit card */}
            <View style={styles.miniCard}>
              <View style={styles.miniCardRow}>
                <Text style={styles.miniCardLabel}>{t('list.quantity')}</Text>
                <View style={styles.miniQtyStepper}>
                  <TouchableOpacity
                    style={styles.miniStepBtn}
                    onPress={() => setEditQty(Math.max(1, editQty - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniStepBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.miniStepNum}>{editQty}</Text>
                  <TouchableOpacity
                    style={styles.miniStepBtn}
                    onPress={() => setEditQty(editQty + 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.miniStepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.miniCardDivider} />

              <View style={styles.miniCardRow}>
                <Text style={styles.miniCardLabel}>{t('list.unit')}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={styles.unitChipsScroll}
              >
                {UNIT_OPTIONS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, editUnit === u && styles.unitChipActive]}
                    onPress={() => setEditUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.unitChipText, editUnit === u && styles.unitChipTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Note input card */}
            <View style={styles.miniNoteCard}>
              <Text style={styles.miniCardLabel}>{t('list.note')}</Text>
              <TextInput
                style={styles.miniNote}
                placeholder={t('list.notePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                value={editNote}
                onChangeText={setEditNote}
                returnKeyType="done"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── REPEAT LAST LIST MODAL ── */}
      <Modal
        visible={repeatModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRepeatModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setRepeatModalVisible(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('list.lastTrip')}</Text>
            <TouchableOpacity
              style={styles.repeatSelectAllBtn}
              onPress={() => {
                if (repeatChecked.size === lastListItems.length) {
                  setRepeatChecked(new Set())
                } else {
                  setRepeatChecked(new Set(lastListItems.map((_, i) => i)))
                }
              }}
            >
              <Text style={styles.repeatSelectAllText}>
                {repeatChecked.size === lastListItems.length ? t('list.deselectAll') : t('list.selectAll')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date + count */}
          <View style={styles.repeatModalMeta}>
            <Text style={styles.repeatModalDate}>
              {lastListDate
                ? new Date(lastListDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                : 'Last trip'}
            </Text>
            <View style={styles.repeatModalCountBadge}>
              <Text style={styles.repeatModalCountText}>
                {t('list.selectedOf', { checked: repeatChecked.size, total: lastListItems.length })}
              </Text>
            </View>
          </View>

          {/* Item list grouped by category */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.repeatItemList}
            showsVerticalScrollIndicator={false}
          >
            {(() => {
              // Group by category
              const grouped: Record<string, { item: typeof lastListItems[0]; idx: number }[]> = {}
              lastListItems.forEach((item, idx) => {
                const cat = item.category || 'other'
                if (!grouped[cat]) grouped[cat] = []
                grouped[cat].push({ item, idx })
              })
              return CATEGORY_ORDER
                .filter(cat => grouped[cat]?.length > 0)
                .map(cat => (
                  <View key={cat}>
                    <View style={styles.repeatCategoryHeader}>
                      <View style={[styles.sectionDot, { backgroundColor: CATEGORY_COLORS[cat] || colors.textTertiary }]} />
                      <Text style={styles.sectionTitle}>{cat.toUpperCase()}</Text>
                    </View>
                    {grouped[cat].map(({ item, idx }) => {
                      const checked = repeatChecked.has(idx)
                      const name = item.custom_item_name || item.product_name || 'Item'
                      const accentColor = CATEGORY_COLORS[cat] || colors.textTertiary
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.repeatItemRow, !checked && styles.repeatItemRowUnchecked]}
                          onPress={() => {
                            const next = new Set(repeatChecked)
                            if (next.has(idx)) next.delete(idx)
                            else next.add(idx)
                            setRepeatChecked(next)
                          }}
                          activeOpacity={0.75}
                        >
                          {/* Accent bar */}
                          <View style={[styles.itemAccent, { backgroundColor: checked ? accentColor : colors.border }]} />

                          {/* Checkbox */}
                          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                            {checked && (
                              <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                                <Path d="M2 6l3 3 5-5" stroke="#FFFFFF" strokeWidth={2}
                                  strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            )}
                          </View>

                          {/* Name + detail */}
                          <View style={styles.itemContent}>
                            <Text style={[styles.itemName, !checked && styles.repeatItemNameUnchecked]}
                              numberOfLines={1}>
                              {name}
                            </Text>
                            {item.unit ? (
                              <Text style={styles.itemSub} numberOfLines={1}>{item.unit}</Text>
                            ) : null}
                          </View>

                          {/* Qty badge */}
                          {item.quantity > 1 && (
                            <View style={styles.repeatQtyBadge}>
                              <Text style={styles.repeatQtyBadgeText}>×{item.quantity}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                ))
            })()}
          </ScrollView>

          {/* Add button */}
          <View style={styles.repeatAddWrap}>
            <TouchableOpacity
              style={[styles.repeatAddBtn, (repeating || repeatChecked.size === 0) && { opacity: 0.5 }]}
              onPress={handleRepeat}
              disabled={repeating || repeatChecked.size === 0}
              activeOpacity={0.85}
            >
              {repeating
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.repeatAddBtnText}>
                    {t('list.repeatAddBtn', { count: repeatChecked.size })}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── TOAST ── */}
      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: toastAnim }]}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round">
            <Path d="M20 6L9 17l-5-5" />
          </Svg>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    overflow: 'hidden',
  },
  heroSkeleton: {
    paddingBottom: 24,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -20,
    left: -30,
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
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sharedPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  sharedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  heroClearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    marginTop: 4,
  },
  heroClearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryAmountLeft: {
    flex: 1,
    marginRight: 12,
  },
  summaryAmountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  summaryAmountOver: {
    color: '#FCA5A5',
  },
  summarySubAmount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
    fontWeight: '500',
  },
  summaryPills: {
    gap: 6,
    alignItems: 'flex-end',
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  summaryPillGreen: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summaryPillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryPillValueGreen: {
    color: '#FFFFFF',
  },
  summaryPillLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  summaryPillLabelGreen: {
    color: 'rgba(255,255,255,0.8)',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  summaryBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryBudgetLeft: {
    flex: 1,
    gap: 7,
  },
  summaryBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: 5,
    borderRadius: 3,
  },
  summaryBudgetText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  summaryBudgetTextOver: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  summaryBudgetCta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  summaryEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── White sheet ───────────────────────────────────────────────────────────
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: 'hidden',
  },

  // ── Completion banner ─────────────────────────────────────────────────────
  completionBanner: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 14,
  },
  completionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completionTextCol: {
    flex: 1,
    gap: 2,
  },
  completionCheck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCheckText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  completionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  completionSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  completionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completionDoneBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completionScanBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  completionScanBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontWeight: '500',
  },

  // Item cards
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 0,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  itemCardChecked: {
    opacity: 0.55,
  },
  itemAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemNote: {
    fontSize: 11,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  itemPriceReal: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 18,
  },
  qtyCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },

  // Where to shop card
  whereToShopWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: colors.heroDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  whereToShopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  whereToShopCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: -20,
    top: -30,
  },
  whereToShopLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whereToShopIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whereToShopText: {
    flex: 1,
    gap: 2,
  },
  whereToShopLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  whereToShopTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  whereToShopSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  whereToShopArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 32,
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
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  repeatBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── Repeat modal ──────────────────────────────────────────────────────────
  repeatSelectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  repeatSelectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  repeatModalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  repeatModalDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  repeatModalCountBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  repeatModalCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  repeatCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 6,
  },
  repeatItemList: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  repeatItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    gap: 0,
  },
  repeatItemRowUnchecked: {
    opacity: 0.5,
  },
  repeatItemNameUnchecked: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through' as const,
  },
  repeatQtyBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 10,
  },
  repeatQtyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  repeatAddWrap: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  repeatAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  repeatAddBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Skeleton
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

  // ── Search results panel ───────────────────────────────────────────────────
  resultsPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  resultsDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 2,
  },

  // ── Concept header ─────────────────────────────────────────────────────────
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  conceptHeaderOpen: {
    backgroundColor: colors.primaryLight,
    borderBottomColor: '#BBF7D0',
  },
  conceptIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptIconBadgeOpen: {
    backgroundColor: colors.primary,
  },
  conceptIconLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textTertiary,
  },
  conceptIconLetterOpen: {
    color: '#FFFFFF',
  },
  conceptHeaderContent: {
    flex: 1,
    gap: 2,
  },
  conceptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  conceptTitleOpen: {
    color: colors.primaryDark,
  },
  conceptSubline: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '400',
  },
  conceptChevron: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  conceptChevronOpen: {
    color: colors.primary,
  },
  conceptBody: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Size chips
  sizeChipsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  sizeChip: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 88,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sizeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sizeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sizeChipLabelActive: {
    color: '#FFFFFF',
  },
  sizeChipPrice: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sizeChipPriceActive: {
    color: 'rgba(255,255,255,0.75)',
  },

  // Store cards section
  storeCardsSection: {
    paddingBottom: 8,
  },
  storeCardsSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  storeCardsScroll: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    gap: 10,
    flexDirection: 'row',
  },
  storeCard: {
    width: 112,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  storeCardBest: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  storeCardSelected: {
    borderColor: colors.blue,
    borderWidth: 2.5,
    shadowColor: colors.blue,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardImgBox: {
    width: '100%',
    height: 60,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bestBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.primary,
    borderRadius: 0,
    borderBottomRightRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardPriceBest: {
    color: colors.primary,
  },
  cardPriceSelected: {
    color: colors.blue,
  },
  cardBrand: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    marginBottom: 6,
  },
  storeChip: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  storeChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cardLoyalty: {
    fontSize: 9,
    color: colors.orange,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.blue,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addedConfirmRow: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  addedConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  addToListBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addToListBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addToListHint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: 4,
  },

  // No results
  noResultsWrap: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  noResultsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  noResultsSub: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addCustomTrigger: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  addCustomTriggerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },

  // Mini form
  miniFormWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.background,
  },
  miniItemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  miniItemPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  miniItemPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    flex: 1,
  },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  miniCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  miniCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  miniCardDivider: {
    height: 1,
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 16,
  },
  miniQtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniStepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniStepBtnText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  miniStepNum: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
  },
  unitChipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 4,
    gap: 8,
    flexDirection: 'row',
  },
  unitChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  miniNoteCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 6,
    marginBottom: 10,
  },
  miniNote: {
    height: 40,
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: 0,
    marginTop: 6,
  },

  // Pinned add button
  miniPinnedBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  miniPinnedBtnInner: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  miniPinnedBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Manual hint
  manualHint: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  manualHintText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Skeleton rows (search panel)
  skeletonWrap: {
    padding: 16,
    gap: 10,
  },
  skeletonRow: {
    height: 52,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
  },

  // ── Bottom input bar ───────────────────────────────────────────────────────
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: 48,
    letterSpacing: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Budget modal ───────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveBtnDisabled: {
    opacity: 0.4,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editModalContent: {
    padding: 20,
    gap: 12,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    gap: 24,
  },
  modalAmountSection: {
    alignItems: 'center',
  },
  modalAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDollarSign: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.textTertiary,
    marginRight: 4,
  },
  modalAmountInput: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
  },
  modalAmountUnderline: {
    width: 160,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginTop: 8,
  },
  modalPresetsSection: {},
  modalPresetsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  modalPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
    color: '#FFFFFF',
  },
  modalSummaryCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSummaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalSummaryStat: {
    flex: 1,
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
    height: 36,
    backgroundColor: colors.border,
  },

  // ── v2 List UI (Apple Reminders-style) ────────────────────────────────────
  v2SectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
    backgroundColor: colors.background,
  },
  v2SectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  v2SectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.0,
    marginRight: 10,
  },
  v2SectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginRight: 8,
  },
  v2SectionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },

  v2ItemWrap: {
    backgroundColor: '#FFFFFF',
  },
  v2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 52,
  },
  v2CheckWrap: {
    marginRight: 12,
  },
  v2Circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  v2ItemBody: {
    flex: 1,
    marginRight: 8,
  },
  v2ItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  v2ItemNameChecked: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  v2ItemSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },
  v2ItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  v2QtyBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  v2QtyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  v2Price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  v2PriceChecked: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },

  v2Expanded: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  v2ExpandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  v2ExpandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    width: 64,
    letterSpacing: 0.2,
  },
  v2Stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  v2StepBtn: {
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  v2StepBtnText: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  v2StepCount: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  v2UnitScroll: {
    flex: 1,
  },
  v2UnitScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  v2UnitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  v2UnitChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  v2UnitChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  v2UnitChipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  v2NoteInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  v2ActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  v2DeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.redLight,
    backgroundColor: colors.redLight,
  },
  v2DeleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.red,
  },
  v2SaveBtn: {
    flex: 1,
    height: 38,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  v2SaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  v2Separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 56,
  },
})
