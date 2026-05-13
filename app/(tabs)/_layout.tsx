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

function ListIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Line x1="8" y1="6" x2="21" y2="6" />
      <Line x1="8" y1="12" x2="21" y2="12" />
      <Line x1="8" y1="18" x2="21" y2="18" />
      <Line x1="3" y1="6" x2="3.01" y2="6" />
      <Line x1="3" y1="12" x2="3.01" y2="12" />
      <Line x1="3" y1="18" x2="3.01" y2="18" />
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

      {/* Search hidden — route still accessible */}
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="list"
        options={{
          title: 'My List',
          tabBarIcon: ({ color }) => <ListIcon color={color} />,
        }}
      />

      {/* Scan hidden — route still accessible for future use */}
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
