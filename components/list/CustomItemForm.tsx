import { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDefaultUnit } from '../../lib/searchProducts'

// ─── Unit options ─────────────────────────────────────────────────────────────

const UNITS = [
  'each', 'pack', 'lb', 'oz', 'kg',
  'gallon', 'liter', 'bottle', 'bag',
  'box', 'can', 'bunch', 'dozen', 'pint',
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomItemFormProps {
  itemName: string
  onAdd: (name: string, qty: number, unit: string, notes: string) => void
  onCancel: () => void
  onRequestTracking: (name: string) => void
}

// ─── Label component ──────────────────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomItemForm({ itemName, onAdd, onCancel, onRequestTracking }: CustomItemFormProps) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState(itemName)
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState(getDefaultUnit(itemName))
  const [notes, setNotes] = useState('')
  const nameInputRef = useRef<TextInput>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), qty, unit, notes.trim())
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add item</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable fields */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Item name */}
        <View style={styles.field}>
          <FieldLabel text="Item" />
          <TextInput
            ref={nameInputRef}
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Item name"
            placeholderTextColor="#8EB69B"
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        {/* Quantity */}
        <View style={styles.field}>
          <FieldLabel text="Quantity" />
          <View style={styles.qtyContainer}>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnLeft, qty <= 1 && styles.qtyBtnDisabled]}
              onPress={() => setQty(q => Math.max(1, q - 1))}
              disabled={qty <= 1}
            >
              <Text style={[styles.qtyBtnText, qty <= 1 && styles.qtyBtnTextDisabled]}>−</Text>
            </TouchableOpacity>
            <View style={styles.qtyDisplay}>
              <Text style={styles.qtyNumber}>{qty}</Text>
            </View>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnRight]}
              onPress={() => setQty(q => q + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unit chips */}
        <View style={styles.field}>
          <FieldLabel text="Unit" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitChipsRow}
            style={styles.unitScroll}
          >
            {UNITS.map(u => {
              const selected = unit === u
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, selected && styles.unitChipSelected]}
                  onPress={() => setUnit(u)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.unitChipText, selected && styles.unitChipTextSelected]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <FieldLabel text="Note to self (optional)" />
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. strawberry flavor, organic if available"
            placeholderTextColor="#8EB69B"
            multiline
            returnKeyType="done"
            blurOnSubmit
          />
        </View>

        {/* Price tracking nudge */}
        <TouchableOpacity
          style={styles.nudgeCard}
          onPress={() => onRequestTracking(name.trim() || itemName)}
          activeOpacity={0.75}
        >
          <View style={styles.nudgeIcon}>
            <Text style={styles.nudgeIconText}>i</Text>
          </View>
          <View style={styles.nudgeTextCol}>
            <Text style={styles.nudgeLine1}>We don't have prices for this yet.</Text>
            <Text style={styles.nudgeLink}>Help us add it →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed bottom button — outside ScrollView, inside KAV, floats above keyboard */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim()}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>Add to My List</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: '#235347',
    fontWeight: '400',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#051F20',
  },
  headerSpacer: {
    width: 32,
  },

  // Scroll content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // Field layout
  field: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8EB69B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Text inputs
  textInput: {
    height: 52,
    backgroundColor: '#F5F7F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#051F20',
  },
  notesInput: {
    height: undefined,
    minHeight: 52,
    maxHeight: 100,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },

  // Quantity stepper
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  qtyBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#F5F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnLeft: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  qtyBtnRight: {
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyBtnText: {
    fontSize: 24,
    color: '#235347',
    fontWeight: '300',
    lineHeight: 28,
  },
  qtyBtnTextDisabled: {
    color: '#B0C4B0',
  },
  qtyDisplay: {
    width: 72,
    height: 52,
    backgroundColor: '#F5F7F5',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E8F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051F20',
  },

  // Unit chips
  unitScroll: {
    marginHorizontal: -20,
  },
  unitChipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E8F0E8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitChipSelected: {
    backgroundColor: '#235347',
    borderColor: '#235347',
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7B7A',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Nudge card
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F0F9F0',
    borderRadius: 10,
    padding: 12,
  },
  nudgeIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#8EB69B',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nudgeIconText: {
    fontSize: 11,
    color: '#8EB69B',
    fontWeight: '700',
    lineHeight: 13,
  },
  nudgeTextCol: {
    flex: 1,
  },
  nudgeLine1: {
    fontSize: 12,
    color: '#6B7B7A',
  },
  nudgeLink: {
    fontSize: 12,
    color: '#235347',
    fontWeight: '600',
    marginTop: 2,
  },

  // Bottom button
  bottomArea: {
    padding: 16,
    paddingBottom: 8,
  },
  addBtn: {
    height: 52,
    backgroundColor: '#235347',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#235347',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnDisabled: {
    opacity: 0.45,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
