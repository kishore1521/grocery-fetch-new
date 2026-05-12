import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
      stroke={colors.textTertiary} strokeWidth={2} strokeLinecap="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  )
}

function ShieldIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  )
}

function BellIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  )
}

function StoreIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Path d="M9 22V12h6v10" />
    </Svg>
  )
}

function HelpIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <Line x1="12" y1="17" x2="12.01" y2="17"
        stroke={colors.primary} strokeWidth={2} />
    </Svg>
  )
}

// ─── Row component ────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onPress?: () => void
  destructive?: boolean
  last?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, !last && styles.settingsRowDivider]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.settingsIconWrap,
        destructive && styles.settingsIconWrapRed,
      ]}>
        {icon}
      </View>
      <View style={styles.settingsRowContent}>
        <Text style={[styles.settingsLabel, destructive && styles.settingsLabelRed]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={styles.settingsSublabel}>{sublabel}</Text>
        )}
      </View>
      <ChevronRight />
    </TouchableOpacity>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { session, isGuest } = useAuthStore()

  const email = session?.user?.email ?? 'Guest'
  const initials = email === 'Guest'
    ? 'G'
    : email.slice(0, 2).toUpperCase()

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => { await supabase.auth.signOut() },
      },
    ])
  }

  return (
    <View style={styles.root}>

      {/* ── HERO ── */}
      <LinearGradient
        colors={[colors.heroDark, colors.heroMid, colors.heroLight]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <SafeAreaView edges={['top']}>
          <View style={styles.heroInner}>
            <Text style={styles.heroLabel}>ACCOUNT</Text>

            <View style={styles.heroAvatarRow}>
              {/* Avatar */}
              <LinearGradient
                colors={[colors.primary, '#00C853']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>

              <View style={styles.heroUserInfo}>
                <Text style={styles.heroName}>
                  {isGuest ? 'Guest User' : (session?.user?.user_metadata?.first_name as string | undefined) ?? 'Shopper'}
                </Text>
                <Text style={styles.heroEmail}>{email}</Text>
                {isGuest && (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>GUEST</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── WHITE SHEET ── */}
      <View style={styles.sheetContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Preferences section */}
          <Text style={styles.groupLabel}>PREFERENCES</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<StoreIcon />}
              label="My Stores"
              sublabel="Manage your preferred stores"
              onPress={() => Alert.alert('Coming soon', 'Store preferences coming in Week 4')}
            />
            <SettingsRow
              icon={<BellIcon />}
              label="Notifications"
              sublabel="Weekly reminders and alerts"
              onPress={() => Alert.alert('Coming soon', 'Notification settings coming in Week 6')}
              last
            />
          </View>

          {/* Account section */}
          <Text style={[styles.groupLabel, { marginTop: 24 }]}>ACCOUNT</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<ShieldIcon />}
              label="Privacy Policy"
              onPress={() => Alert.alert('Coming soon', 'Privacy policy URL coming before launch')}
            />
            <SettingsRow
              icon={<HelpIcon />}
              label="Help & Support"
              onPress={() => Alert.alert('Coming soon', 'Help center coming in Week 6')}
              last
            />
          </View>

          {/* Sign out */}
          <Text style={[styles.groupLabel, { marginTop: 24 }]}>SESSION</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.signOutRow}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Grocery Fetch · Week 2 Build</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero
  hero: {
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -10,
    left: -10,
  },
  heroInner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  heroAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroUserInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
  },
  guestBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // White sheet
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  // Settings groups
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingsRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  },
  settingsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconWrapRed: {
    backgroundColor: colors.redLight,
  },
  settingsRowContent: {
    flex: 1,
    gap: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingsLabelRed: {
    color: colors.red,
  },
  settingsSublabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // Sign out
  signOutRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.red,
  },

  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
})
