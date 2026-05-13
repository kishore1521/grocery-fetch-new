import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { colors } from '../../constants/colors'

// ─── Tab Icons ────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  )
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  )
}

// ─── Center List Button ───────────────────────────────────────────────────────

function ListCenterIcon() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none"
      stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {/* Cart body */}
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <Line x1="3" y1="6" x2="21" y2="6" />
      {/* Plus sign */}
      <Line x1="12" y1="10" x2="12" y2="16" />
      <Line x1="9" y1="13" x2="15" y2="13" />
    </Svg>
  )
}

function ListTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.listTabWrap}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.listTabCircle}>
        <ListCenterIcon />
      </View>
    </TouchableOpacity>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />

      {/* Search hidden from tab bar — route still accessible */}
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="list"
        options={{
          title: '',
          tabBarButton: ({ onPress }) => (
            <ListTabButton onPress={onPress as () => void} />
          ),
        }}
      />

      {/* Scan hidden from tab bar — route still accessible for future use */}
      <Tabs.Screen
        name="scan"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  listTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -16,
  },
  listTabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
})
