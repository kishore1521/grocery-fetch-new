import { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native'
import { GroceryListItem } from '../../types'

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

interface ListItemProps {
  item: GroceryListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onIncrement: (id: string, quantity: number) => void
  onDecrement: (id: string, quantity: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListItem({ item, onToggle, onDelete, onIncrement, onDecrement }: ListItemProps) {
  const [showDelete, setShowDelete] = useState(false)
  const checkAnim = useRef(new Animated.Value(item.is_checked ? 1 : 0)).current

  const handlePress = () => {
    if (showDelete) {
      setShowDelete(false)
      return
    }
    Animated.spring(checkAnim, {
      toValue: item.is_checked ? 0 : 1,
      useNativeDriver: true,
      tension: 180,
      friction: 7,
    }).start()
    onToggle(item.id)
  }

  const handleLongPress = () => {
    setShowDelete(true)
  }

  const handleDeleteConfirm = () => {
    setShowDelete(false)
    onDelete(item.id)
  }

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 1],
  })

  const displayName = item.product?.name ?? item.custom_item_name ?? 'Item'
  const category = item.product?.category
  const accent = getAccent(category)
  const brand = item.product?.brand
  const unit = item.product?.unit
  const brandUnit = [brand, unit].filter(Boolean).join(' · ')

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
      delayLongPress={400}
    >
      {/* Checkbox */}
      <Animated.View
        style={[
          styles.checkbox,
          item.is_checked && styles.checkboxChecked,
          { transform: [{ scale: checkScale }] },
        ]}
      >
        {item.is_checked && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.name, item.is_checked && styles.nameChecked]}
          numberOfLines={2}
        >
          {displayName}
        </Text>
        {(brandUnit || category) ? (
          <View style={styles.metaRow}>
            {brandUnit ? (
              <Text style={styles.brandText} numberOfLines={1}>{brandUnit}</Text>
            ) : null}
            {category ? (
              <View style={[styles.categoryPill, { backgroundColor: accent + '22' }]}>
                <Text style={[styles.categoryPillText, { color: accent }]}>
                  {category.toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Quantity controls — hide when checked */}
      {!item.is_checked && (
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onDecrement(item.id, item.quantity - 1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onIncrement(item.id, item.quantity + 1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete overlay */}
      {showDelete && (
        <TouchableOpacity style={styles.deleteOverlay} onPress={handleDeleteConfirm} activeOpacity={0.85}>
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text style={styles.deleteLabel}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },

  // Checkbox
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D0DAD0',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#235347',
    borderColor: '#235347',
  },
  checkmark: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 16,
  },

  // Content
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#051F20',
    lineHeight: 20,
  },
  nameChecked: {
    color: '#A0B0A0',
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  brandText: {
    fontSize: 12,
    color: '#8EB69B',
    fontWeight: '400',
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Quantity
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#235347',
    fontWeight: '600',
    lineHeight: 20,
  },
  qtyNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#051F20',
    minWidth: 28,
    textAlign: 'center',
    marginHorizontal: 4,
  },

  // Delete overlay
  deleteOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: '#FF3B30',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
  deleteLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
})
