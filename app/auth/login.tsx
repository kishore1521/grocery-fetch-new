import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Login Screen</Text>
      <Text style={styles.sub}>Week 1 — Coming next</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { fontSize: 24, fontWeight: '700', color: colors.dark },
  sub: { fontSize: 14, color: colors.gray400, marginTop: 8 },
})
