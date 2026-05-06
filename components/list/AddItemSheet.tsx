import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { searchProducts } from '../../lib/searchProducts'
import { Product } from '../../types'

// ─── Category accent colors ───────────────────────────────────────────────────

const CATEGORY_ACCENT: Record<string, string> = {
  produce:   '#4CAF50',
  dairy:     '#2196F3',
  meat:      '#F44336',
  bakery:    '#FF9800',
  beverages: '#00BCD4',
  frozen:    '#9C27B0',
  pantry:    '#795548',
  household: '#607D8B',
  deli:      '#F44336',
  other:     '#9E9E9E',
}

function getAccent(category: string | undefined): string {
  return CATEGORY_ACCENT[category ?? 'other'] ?? '#9E9E9E'
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddItemSheetProps {
  visible: boolean
  onClose: () => void
  onAddProduct: (product: Product) => void
  onAddCustom: (name: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddItemSheet({ visible, onClose, onAddProduct, onAddCustom }: AddItemSheetProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const slideAnim = useRef(new Animated.Value(500)).current
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible) {
      setQuery('')
      setResults([])
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }).start()
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((text: string) => {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!text.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const found = await searchProducts(text)
      setResults(found)
      setSearching(false)
    }, 300)
  }, [])

  const handleAddCustom = () => {
    if (!query.trim()) return
    onAddCustom(query.trim())
    setQuery('')
    setResults([])
    onClose()
  }

  const handleAddProduct = (product: Product) => {
    onAddProduct(product)
    setQuery('')
    setResults([])
    onClose()
  }

  const showResults = query.trim().length > 0
  const noResults = showResults && !searching && results.length === 0

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kavWrapper}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>Add items</Text>

          {/* Search input */}
          <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search products…"
              placeholderTextColor="#8EB69B"
              autoFocus
              returnKeyType="search"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => { setQuery(''); setResults([]) }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          {searching ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#235347" size="small" />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              ListEmptyComponent={
                noResults ? (
                  <Text style={styles.noResultsText}>
                    No products found. Use the custom field below.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const accent = getAccent(item.category)
                const firstLetter = item.name.charAt(0).toUpperCase()
                const brandUnit = [item.brand, item.unit].filter(Boolean).join(' · ')
                return (
                  <View style={styles.productRow}>
                    <View style={[styles.productIconCircle, { backgroundColor: accent + '33' }]}>
                      <Text style={[styles.productIconLetter, { color: accent }]}>{firstLetter}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      {brandUnit ? (
                        <Text style={styles.productSub} numberOfLines={1}>{brandUnit}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.addCircleBtn}
                      onPress={() => handleAddProduct(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.addCirclePlus}>+</Text>
                    </TouchableOpacity>
                  </View>
                )
              }}
            />
          )}

          {/* Custom item section */}
          <View style={styles.customSection}>
            <Text style={styles.customLabel}>Or type anything:</Text>
            <TextInput
              style={styles.customInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="e.g. Coconut water, Goya beans…"
              placeholderTextColor="#8EB69B"
              returnKeyType="done"
              onSubmitEditing={handleAddCustom}
            />
          </View>

          {/* Done button */}
          <TouchableOpacity
            style={[styles.doneBtn, !query.trim() && styles.doneBtnDisabled]}
            onPress={query.trim() ? handleAddCustom : onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{query.trim() ? 'Add item' : 'Done'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,31,32,0.45)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 32,
    maxHeight: '82%',
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0DAD0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Search input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    height: 48,
    backgroundColor: '#F5F7F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputWrapFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#235347',
  },
  searchIcon: {
    fontSize: 15,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#051F20',
    height: 48,
  },
  clearBtn: {
    fontSize: 14,
    color: '#8EB69B',
    paddingLeft: 4,
  },

  // Results
  resultsList: {
    maxHeight: 240,
  },
  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 13,
    color: '#8EB69B',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    lineHeight: 18,
  },

  // Product row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
  },
  productIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productIconLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051F20',
  },
  productSub: {
    fontSize: 12,
    color: '#8EB69B',
    marginTop: 2,
  },
  addCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#235347',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addCirclePlus: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 20,
  },

  // Custom item
  customSection: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  customLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8EB69B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  customInput: {
    height: 48,
    backgroundColor: '#F5F7F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#051F20',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  // Done button
  doneBtn: {
    margin: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#235347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnDisabled: {
    backgroundColor: '#8EB69B',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
