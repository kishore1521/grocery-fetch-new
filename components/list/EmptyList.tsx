import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'

interface EmptyListProps {
  onAddItem: () => void
}

function ShoppingBagSVG() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke="#8EB69B"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 6h18"
        stroke="#8EB69B"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 10a4 4 0 01-8 0"
        stroke="#8EB69B"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function EmptyList({ onAddItem }: EmptyListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <ShoppingBagSVG />
      </View>

      <Text style={styles.title}>Your list is empty</Text>
      <Text style={styles.subtitle}>
        Add groceries to compare prices{'\n'}and start saving on Long Island.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onAddItem} activeOpacity={0.85}>
        <Text style={styles.buttonText}>Add your first item</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  illustration: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F9F0',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#051F20',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#8EB69B',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 28,
    maxWidth: 260,
  },
  button: {
    backgroundColor: '#235347',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#235347',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
