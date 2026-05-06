import { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useList } from '../../hooks/useList'
import { useAuthStore } from '../../stores/authStore'
import { EmptyList } from '../../components/list/EmptyList'
import { ListItem } from '../../components/list/ListItem'
import { AddItemSheet } from '../../components/list/AddItemSheet'
import { GroceryListItem, Product } from '../../types'

// ─── Category ordering ────────────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'produce', 'dairy', 'meat', 'deli', 'bakery',
  'frozen', 'beverages', 'pantry', 'household', 'other',
]

const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Produce',   dairy: 'Dairy',   meat: 'Meat',
  deli: 'Deli',         bakery: 'Bakery',  frozen: 'Frozen',
  beverages: 'Beverages', pantry: 'Pantry',
  household: 'Household', other: 'Other',
}

const CATEGORY_ACCENT: Record<string, string> = {
  produce: '#4CAF50',   dairy: '#2196F3',   meat: '#F44336',
  deli: '#F44336',      bakery: '#FF9800',   frozen: '#9C27B0',
  beverages: '#00BCD4', pantry: '#795548',
  household: '#607D8B', other: '#9E9E9E',
}

// ─── Grouping helper ──────────────────────────────────────────────────────────

interface Section {
  title: string
  category: string
  data: GroceryListItem[]
  count: number
}

function groupByCategory(items: GroceryListItem[]): Section[] {
  const map: Record<string, GroceryListItem[]> = {}
  for (const item of items) {
    const cat = item.product?.category ?? 'other'
    if (!map[cat]) map[cat] = []
    map[cat].push(item)
  }
  const sections: Section[] = []
  for (const cat of CATEGORY_ORDER) {
    if (map[cat]?.length) {
      sections.push({ title: CATEGORY_LABELS[cat] ?? cat, category: cat, data: map[cat], count: map[cat].length })
    }
  }
  for (const cat of Object.keys(map)) {
    if (!CATEGORY_ORDER.includes(cat) && map[cat].length) {
      sections.push({ title: cat, category: cat, data: map[cat], count: map[cat].length })
    }
  }
  return sections
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ListScreen() {
  const { isGuest } = useAuthStore()
  const {
    items,
    loading,
    error,
    fetchActiveList,
    addProductToList,
    addCustomItem,
    toggleChecked,
    updateQuantity,
    deleteItem,
    clearChecked,
  } = useList()

  const [sheetVisible, setSheetVisible] = useState(false)

  useEffect(() => {
    if (!isGuest) fetchActiveList()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddProduct = useCallback((product: Product) => {
    addProductToList(product)
  }, [addProductToList])

  const handleAddCustom = useCallback((name: string) => {
    addCustomItem(name)
  }, [addCustomItem])

  const handleClearChecked = useCallback(() => {
    const checkedCount = items.filter(i => i.is_checked).length
    Alert.alert(
      'Clear checked items',
      `Remove ${checkedCount} checked item${checkedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChecked },
      ]
    )
  }, [items, clearChecked])

  const uncheckedItems = items.filter(i => !i.is_checked)
  const checkedItems = items.filter(i => i.is_checked)
  const allDone = items.length > 0 && uncheckedItems.length === 0

  const sections = groupByCategory(uncheckedItems)
  if (checkedItems.length > 0) {
    sections.push({ title: 'Done', category: '__done', data: checkedItems, count: checkedItems.length })
  }

  // ─── Guest state ─────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My List</Text>
        </View>
        <View style={styles.guestContainer}>
          <Text style={styles.guestIcon}>🔒</Text>
          <Text style={styles.guestTitle}>Sign in to use your list</Text>
          <Text style={styles.guestSub}>Create an account to save your grocery list and compare prices.</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My List</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#235347" />
        </View>
      </SafeAreaView>
    )
  }

  // ─── Error state ──────────────────────────────────────────────────────────────
  if (error && items.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My List</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchActiveList}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        {/* Row 1: title + add button */}
        <View style={styles.headerRow1}>
          <Text style={styles.headerTitle}>My List</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: item count + clear done (only when items exist) */}
        {items.length > 0 && (
          <View style={styles.headerRow2}>
            <Text style={styles.itemCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
            <View style={styles.flex1} />
            {checkedItems.length > 0 && (
              <TouchableOpacity onPress={handleClearChecked}>
                <Text style={styles.clearDoneText}>Clear done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Completion banner */}
      {allDone && (
        <View style={styles.doneBanner}>
          <View style={styles.doneBannerCircle}>
            <Text style={styles.doneBannerCheck}>✓</Text>
          </View>
          <View style={styles.doneBannerContent}>
            <Text style={styles.doneBannerTitle}>All done! 🎉</Text>
            <Text style={styles.doneBannerSub}>Scan receipt to track savings</Text>
          </View>
          <TouchableOpacity style={styles.doneBannerScanBtn}>
            <Text style={styles.doneBannerScanText}>Scan →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty or list */}
      {items.length === 0 ? (
        <EmptyList onAddItem={() => setSheetVisible(true)} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ListItem
              item={item}
              onToggle={toggleChecked}
              onDelete={deleteItem}
              onIncrement={updateQuantity}
              onDecrement={updateQuantity}
            />
          )}
          renderSectionHeader={({ section }) => {
            const accent = CATEGORY_ACCENT[section.category] ?? '#9E9E9E'
            const isDone = section.category === '__done'
            return (
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccentLine, { backgroundColor: isDone ? '#9E9E9E' : accent }]} />
                <Text style={styles.sectionTitle}>
                  {section.title.toUpperCase()}
                </Text>
                <View style={styles.sectionCountPill}>
                  <Text style={styles.sectionCountText}>{section.count}</Text>
                </View>
              </View>
            )
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Bottom cost bar */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <Text style={styles.estimatedLabel}>Estimated total</Text>
            <Text style={styles.estimatedValue}>$--</Text>
          </View>
          <TouchableOpacity
            style={styles.findStoreBtn}
            onPress={() => Alert.alert('Coming soon', 'Price comparison will be available in the next update.')}
            activeOpacity={0.85}
          >
            <Text style={styles.findStoreBtnText}>Find best store →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add item sheet */}
      <AddItemSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onAddProduct={handleAddProduct}
        onAddCustom={handleAddCustom}
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#235347',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#235347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 26,
  },
  headerRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  itemCount: {
    fontSize: 13,
    color: '#8EB69B',
    fontWeight: '500',
  },
  flex1: {
    flex: 1,
  },
  clearDoneText: {
    fontSize: 13,
    color: '#235347',
    fontWeight: '600',
  },

  // Completion banner
  doneBanner: {
    margin: 16,
    backgroundColor: '#F0F9F0',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#B8DDB8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneBannerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#235347',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  doneBannerCheck: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 24,
  },
  doneBannerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  doneBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#051F20',
  },
  doneBannerSub: {
    fontSize: 12,
    color: '#6B7B7A',
    marginTop: 2,
  },
  doneBannerScanBtn: {
    backgroundColor: '#235347',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneBannerScanText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  sectionAccentLine: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8EB69B',
    letterSpacing: 1.2,
  },
  sectionCountPill: {
    backgroundColor: '#F0F4F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    color: '#8EB69B',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingBottom: 110,
    paddingTop: 8,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EE',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBarLeft: {
    flex: 1,
  },
  estimatedLabel: {
    fontSize: 11,
    color: '#8EB69B',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  estimatedValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  findStoreBtn: {
    backgroundColor: '#235347',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#235347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  findStoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Guest / error / loading
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestIcon: { fontSize: 48, marginBottom: 16 },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 14,
    color: '#8EB69B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#235347',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
