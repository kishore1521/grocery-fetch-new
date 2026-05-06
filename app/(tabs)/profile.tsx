import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { colors } from '../../constants/colors'
import { supabase } from '../../lib/supabase'

export default function ProfileScreen() {
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          // _layout.tsx session listener handles redirect to login
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <Text style={styles.sub}>Placeholder — Week 4</Text>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { fontSize: 24, fontWeight: '700', color: colors.dark },
  sub: { fontSize: 13, color: colors.gray400, marginTop: 6, marginBottom: 32 },
  signOutButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.error,
    borderRadius: 12,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
})
