import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native'

// ─── Store options ────────────────────────────────────────────────────────────

const STORE_OPTIONS = [
  { chain: 'ShopRite',    color: '#CC0000' },
  { chain: 'Stop & Shop', color: '#007A3D' },
  { chain: 'Aldi',        color: '#1E3A5F' },
  { chain: 'BJs',         color: '#0047AB' },
  { chain: 'Costco',      color: '#005DAA' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface PriceRequestSheetProps {
  isVisible: boolean
  productName: string
  onClose: () => void
  onSubmit: (name: string, brand: string, stores: string[], notes: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const SHEET_HEIGHT = Dimensions.get('window').height

export function PriceRequestSheet({ isVisible, productName, onClose, onSubmit }: PriceRequestSheetProps) {
  const [formName, setFormName] = useState(productName)
  const [brand, setBrand] = useState('')
  const [selectedStores, setSelectedStores] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current

  // Sync productName prop → form
  useEffect(() => {
    if (isVisible) {
      setFormName(productName)
      setBrand('')
      setSelectedStores([])
      setNotes('')
      setSubmitted(false)
    }
  }, [productName, isVisible])

  // Slide in / out
  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start()
    }
  }, [isVisible]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStore = (chain: string) => {
    setSelectedStores(prev =>
      prev.includes(chain) ? prev.filter(s => s !== chain) : [...prev, chain]
    )
  }

  const handleSubmit = () => {
    if (!formName.trim()) return
    onSubmit(formName.trim(), brand.trim(), selectedStores, notes.trim())
    setSubmitted(true)
  }

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose())
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kavWrapper}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.headerArea}>
              <Text style={styles.headerTitle}>Help us track prices</Text>
              <Text style={styles.headerSub}>Tell us a bit about this product</Text>
            </View>

            {submitted ? (
              /* ─ Success state ─ */
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Request sent! 🙌</Text>
                <Text style={styles.successBody}>
                  We review requests every week and add the{'\n'}most popular products first.
                </Text>
                <TouchableOpacity style={styles.successDoneBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.successDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* ─ Form ─ */
              <>
                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Product name */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Product name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="e.g. Häagen-Dazs Vanilla"
                      placeholderTextColor="#8EB69B"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Brand */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Brand (optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={brand}
                      onChangeText={setBrand}
                      placeholder="e.g. Häagen-Dazs, Goya, Perdue"
                      placeholderTextColor="#8EB69B"
                      returnKeyType="next"
                    />
                  </View>

                  {/* Store chips */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Where do you buy it?</Text>
                    <View style={styles.storeChipsWrap}>
                      {STORE_OPTIONS.map(store => {
                        const selected = selectedStores.includes(store.chain)
                        return (
                          <TouchableOpacity
                            key={store.chain}
                            style={[
                              styles.storeChip,
                              selected && { borderColor: store.color, backgroundColor: store.color + '22' },
                            ]}
                            onPress={() => toggleStore(store.chain)}
                            activeOpacity={0.75}
                          >
                            <View style={[styles.storeDot, { backgroundColor: store.color }]} />
                            <Text style={[
                              styles.storeChipText,
                              selected && { color: store.color, fontWeight: '600' },
                            ]}>
                              {store.chain}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>

                  {/* Notes */}
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Anything else we should know? (optional)</Text>
                    <TextInput
                      style={[styles.textInput, styles.notesInput]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="e.g. 14oz pint, usually near ice cream aisle"
                      placeholderTextColor="#8EB69B"
                      multiline
                      returnKeyType="done"
                      blurOnSubmit
                    />
                  </View>
                </ScrollView>

                {/* Submit button */}
                <View style={styles.bottomArea}>
                  <TouchableOpacity
                    style={[styles.submitBtn, !formName.trim() && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!formName.trim()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,31,32,0.5)',
  },
  kavWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: Dimensions.get('window').height * 0.88,
    shadowColor: '#051F20',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0DAD0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#8EB69B',
    marginTop: 4,
  },

  // Form
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 8,
  },
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
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    backgroundColor: '#F5F7F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#051F20',
  },
  notesInput: {
    height: undefined,
    minHeight: 72,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },

  // Store chips
  storeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#E8F0E8',
    backgroundColor: '#FFFFFF',
  },
  storeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeChipText: {
    fontSize: 13,
    color: '#6B7B7A',
    fontWeight: '500',
  },

  // Bottom
  bottomArea: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  submitBtn: {
    height: 52,
    backgroundColor: '#235347',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#235347',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 38,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051F20',
    marginTop: 16,
    textAlign: 'center',
  },
  successBody: {
    fontSize: 14,
    color: '#6B7B7A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  successDoneBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#235347',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  successDoneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
