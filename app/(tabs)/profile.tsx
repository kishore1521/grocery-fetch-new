import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

const LANGUAGE_OPTIONS = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
]

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

function GlobeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10" />
      <Path d="M2 12h20" />
      <Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
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
  const { t } = useTranslation()
  const { session, isGuest, language, setLanguage } = useAuthStore()

  const email = session?.user?.email ?? 'Guest'
  const initials = email === 'Guest'
    ? 'G'
    : email.slice(0, 2).toUpperCase()

  const handleLanguageChange = async (code: string) => {
    setLanguage(code)
    if (!isGuest && session?.user?.id) {
      try {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: session.user.id, language: code }, { onConflict: 'user_id' })
      } catch (e) {
        console.error('[Profile] language save error:', e)
      }
    }
  }

  const handleSignOut = () => {
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'),
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
            <Text style={styles.heroLabel}>{t('profile.heroLabel')}</Text>

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
                  {isGuest ? t('profile.guestUser') : (session?.user?.user_metadata?.first_name as string | undefined) ?? t('profile.shopper')}
                </Text>
                <Text style={styles.heroEmail}>{email}</Text>
                {isGuest && (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>{t('profile.guestBadge')}</Text>
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
          <Text style={styles.groupLabel}>{t('profile.sectionPreferences')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<StoreIcon />}
              label={t('profile.myStores')}
              sublabel={t('profile.myStoresSub')}
              onPress={() => Alert.alert('Coming soon', 'Store preferences coming in Week 4')}
            />
            <SettingsRow
              icon={<BellIcon />}
              label={t('profile.notifications')}
              sublabel={t('profile.notificationsSub')}
              onPress={() => Alert.alert('Coming soon', 'Notification settings coming in Week 6')}
            />
            {/* Language row — inline picker */}
            <View style={styles.langSection}>
              <View style={styles.langHeaderRow}>
                <View style={styles.settingsIconWrap}>
                  <GlobeIcon />
                </View>
                <View style={styles.settingsRowContent}>
                  <Text style={styles.settingsLabel}>{t('profile.language')}</Text>
                  <Text style={styles.settingsSublabel}>{t('profile.languageSubtitle')}</Text>
                </View>
              </View>
              <View style={styles.langPillRow}>
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = (language ?? 'en') === lang.code
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langPill, isSelected && styles.langPillSelected]}
                      onPress={() => handleLanguageChange(lang.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langPillFlag}>{lang.flag}</Text>
                      <Text style={[styles.langPillText, isSelected && styles.langPillTextSelected]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </View>

          {/* Account section */}
          <Text style={[styles.groupLabel, { marginTop: 24 }]}>{t('profile.sectionAccount')}</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<ShieldIcon />}
              label={t('profile.privacyPolicy')}
              onPress={() => Alert.alert('Coming soon', 'Privacy policy URL coming before launch')}
            />
            <SettingsRow
              icon={<HelpIcon />}
              label={t('profile.helpSupport')}
              onPress={() => Alert.alert('Coming soon', 'Help center coming in Week 6')}
              last
            />
          </View>

          {/* Sign out */}
          <Text style={[styles.groupLabel, { marginTop: 24 }]}>{t('profile.sectionSession')}</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.signOutRow}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>{t('profile.version')}</Text>

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

  // Language picker
  langSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
  },
  langHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  langPillRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 48,
  },
  langPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  langPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langPillFlag: {
    fontSize: 14,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  langPillTextSelected: {
    color: colors.primary,
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
