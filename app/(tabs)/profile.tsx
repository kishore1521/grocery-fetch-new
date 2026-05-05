import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { fontSize: 24, fontWeight: '700', color: colors.dark },
})
