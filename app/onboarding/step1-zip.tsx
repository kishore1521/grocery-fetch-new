import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'

export default function Step1Zip() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding — Step 1: Zip Code</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { fontSize: 18, fontWeight: '600', color: colors.dark },
})
