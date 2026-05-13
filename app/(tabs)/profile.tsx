import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'
import { useListStore } from '../../stores/listStore'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

type HouseholdRow = {
  id: string
  owner_user_id: string
  member_user_id: string | null
  invite_code: string | null
  invite_expires_at: string | null
  status: string
}

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

function PeopleIcon({ color = colors.primary }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 00-3-3.87" />
      <Path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  )
}

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <Path d="M22 4L12 14.01l-3-3" />
    </Svg>
  )
}

function KeyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

const formatCode = (code: string): string =>
  code.slice(0, 3) + ' · ' + code.slice(3)

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

  // ── Household state ───────────────────────────────────────────────────────
  const [householdRow, setHouseholdRow] = useState<HouseholdRow | null>(null)
  const [householdLoading, setHouseholdLoading] = useState(true)
  const [codeModalVisible, setCodeModalVisible] = useState(false)
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [displayCode, setDisplayCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [leavingHousehold, setLeavingHousehold] = useState(false)

  // ── Load household ────────────────────────────────────────────────────────
  const loadHousehold = async () => {
    if (!session?.user.id) {
      setHouseholdLoading(false)
      return
    }
    try {
      const { data } = await supabase
        .from('household_members')
        .select('id, owner_user_id, member_user_id, invite_code, invite_expires_at, status')
        .or(`owner_user_id.eq.${session.user.id},member_user_id.eq.${session.user.id}`)
        .in('status', ['pending', 'accepted'])
        .maybeSingle()
      setHouseholdRow(data as HouseholdRow | null)
    } catch (e) {
      console.error('[Profile] loadHousehold error:', e)
    } finally {
      setHouseholdLoading(false)
    }
  }

  useEffect(() => {
    if (!isGuest) loadHousehold()
    else setHouseholdLoading(false)
  }, [session?.user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate invite code ──────────────────────────────────────────────────
  const handleGenerateCode = async () => {
    if (!session?.user.id) return
    setGeneratingCode(true)
    try {
      const code = generateCode()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('household_members')
        .upsert(
          {
            owner_user_id: session.user.id,
            invite_code: code,
            invite_expires_at: expiresAt,
            status: 'pending',
            member_user_id: null,
          },
          { onConflict: 'owner_user_id' }
        )
        .select('id, owner_user_id, member_user_id, invite_code, invite_expires_at, status')
        .single()
      if (error) throw error
      setHouseholdRow(data as HouseholdRow)
      setDisplayCode(code)
      setCodeModalVisible(true)
    } catch (e) {
      console.error('[Profile] generateCode error:', e)
      Alert.alert('Error', 'Could not generate code. Please try again.')
    } finally {
      setGeneratingCode(false)
    }
  }

  // ── Show existing pending code ────────────────────────────────────────────
  const handleShowExistingCode = () => {
    if (householdRow?.invite_code) {
      setDisplayCode(householdRow.invite_code)
      setCodeModalVisible(true)
    }
  }

  // ── Join household ────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!session?.user.id || joinCode.length !== 6) return
    setJoining(true)
    setJoinError(null)
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('id, owner_user_id, status')
        .eq('invite_code', joinCode.toUpperCase())
        .eq('status', 'pending')
        .gte('invite_expires_at', new Date().toISOString())
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setJoinError('Invalid or expired code. Ask the list owner to generate a new one.')
        return
      }

      const row = data as { id: string; owner_user_id: string; status: string }

      if (row.owner_user_id === session.user.id) {
        setJoinError("You can't join your own household.")
        return
      }

      const { error: updateError } = await supabase
        .from('household_members')
        .update({
          member_user_id: session.user.id,
          status: 'accepted',
          invite_code: null,
          invite_expires_at: null,
        })
        .eq('id', row.id)

      if (updateError) throw updateError

      setJoinSuccess(true)
      await loadHousehold()
      useListStore.getState().bumpRefreshKey()
      setTimeout(() => {
        setJoinModalVisible(false)
        setJoinSuccess(false)
        setJoinCode('')
      }, 2000)
    } catch (e) {
      console.error('[Profile] joinHousehold error:', e)
      setJoinError('Something went wrong. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  // ── Leave household ───────────────────────────────────────────────────────
  const handleLeave = () => {
    Alert.alert(
      'Leave Household',
      'You will no longer share a grocery list. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            if (!householdRow) return
            setLeavingHousehold(true)
            try {
              const { error } = await supabase
                .from('household_members')
                .delete()
                .eq('id', householdRow.id)
              if (error) throw error
              setHouseholdRow(null)
              useListStore.getState().setActiveList(null)
              useListStore.getState().setItems([])
              useListStore.getState().bumpRefreshKey()
            } catch (e) {
              console.error('[Profile] leaveHousehold error:', e)
              Alert.alert('Error', 'Could not leave household. Please try again.')
            } finally {
              setLeavingHousehold(false)
            }
          },
        },
      ]
    )
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
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

  // ── Derive household display state ────────────────────────────────────────
  const isAccepted = householdRow?.status === 'accepted'
  const isPendingOwner =
    householdRow?.status === 'pending' &&
    householdRow?.owner_user_id === session?.user.id
  const isMember =
    isAccepted && householdRow?.member_user_id === session?.user.id

  // ─────────────────────────────────────────────────────────────────────────

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

          {/* ── HOUSEHOLD section ── */}
          {!isGuest && (
            <>
              <Text style={[styles.groupLabel, { marginTop: 24 }]}>HOUSEHOLD</Text>

              {householdLoading ? (
                <View style={styles.householdLoadingCard}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : isAccepted ? (
                /* ── Active household card ── */
                <View style={styles.householdActiveCard}>
                  <View style={styles.householdActiveTop}>
                    <View style={styles.householdActiveIconWrap}>
                      <CheckCircleIcon />
                    </View>
                    <View style={styles.householdActiveText}>
                      <Text style={styles.householdActiveTitle}>Household active</Text>
                      <Text style={styles.householdActiveSub}>
                        {isMember
                          ? "You're sharing the list owner's groceries"
                          : 'Your list is shared with a household member'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.householdActiveBadgeRow}>
                    <View style={styles.householdActiveBadge}>
                      <Text style={styles.householdActiveBadgeText}>
                        👥 List syncs in real time
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.leaveBtn, leavingHousehold && { opacity: 0.6 }]}
                    onPress={handleLeave}
                    disabled={leavingHousehold}
                    activeOpacity={0.75}
                  >
                    {leavingHousehold
                      ? <ActivityIndicator size="small" color={colors.red} />
                      : <Text style={styles.leaveBtnText}>Leave household</Text>
                    }
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── Share your list card ── */
                <>
                  <View style={styles.householdCard}>
                    <View style={styles.householdCardTop}>
                      <View style={styles.householdIconWrap}>
                        <PeopleIcon />
                      </View>
                      <View style={styles.householdCardText}>
                        <Text style={styles.householdCardTitle}>Shop together</Text>
                        <Text style={styles.householdCardSub}>
                          Invite someone to share your grocery list
                        </Text>
                      </View>
                    </View>

                    {isPendingOwner ? (
                      <View style={styles.householdBtnRow}>
                        <TouchableOpacity
                          style={styles.householdBtnSecondary}
                          onPress={handleShowExistingCode}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.householdBtnSecondaryText}>Show invite code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.householdBtn, generatingCode && { opacity: 0.6 }]}
                          onPress={handleGenerateCode}
                          disabled={generatingCode}
                          activeOpacity={0.85}
                        >
                          {generatingCode
                            ? <ActivityIndicator size="small" color="#FFFFFF" />
                            : <Text style={styles.householdBtnText}>New code</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.householdBtn, styles.householdBtnFull, generatingCode && { opacity: 0.6 }]}
                        onPress={handleGenerateCode}
                        disabled={generatingCode}
                        activeOpacity={0.85}
                      >
                        {generatingCode
                          ? <ActivityIndicator size="small" color="#FFFFFF" />
                          : <Text style={styles.householdBtnText}>Generate invite code</Text>
                        }
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Have a code? */}
                  <TouchableOpacity
                    style={styles.haveCodeRow}
                    onPress={() => { setJoinCode(''); setJoinError(null); setJoinModalVisible(true) }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.haveCodeIconWrap}>
                      <KeyIcon />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.haveCodeTitle}>Have an invite code?</Text>
                      <Text style={styles.haveCodeSub}>Join someone else's list</Text>
                    </View>
                    <ChevronRight />
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

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

      {/* ── INVITE CODE MODAL ── */}
      <Modal
        visible={codeModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Invite Code</Text>
            <TouchableOpacity
              onPress={() => setCodeModalVisible(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.codeModalBody}>
            {/* Code display */}
            <View style={styles.codeDisplayCard}>
              <View style={styles.codeDisplayIconWrap}>
                <PeopleIcon color="#FFFFFF" />
              </View>
              <Text style={styles.codeDisplayLabel}>YOUR INVITE CODE</Text>
              <Text style={styles.codeDisplayCode}>
                {displayCode ? formatCode(displayCode) : ''}
              </Text>
              <Text style={styles.codeDisplaySub}>
                Share this code with your household member
              </Text>
              <View style={styles.codeExpiresBadge}>
                <Text style={styles.codeExpiresText}>⏱ Expires in 24 hours</Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.codeInstructionsCard}>
              <Text style={styles.codeInstructionsTitle}>HOW IT WORKS</Text>
              <View style={styles.codeInstructionRow}>
                <View style={styles.codeInstructionNum}><Text style={styles.codeInstructionNumText}>1</Text></View>
                <Text style={styles.codeInstructionText}>Share the code below with your household member</Text>
              </View>
              <View style={styles.codeInstructionRow}>
                <View style={styles.codeInstructionNum}><Text style={styles.codeInstructionNumText}>2</Text></View>
                <Text style={styles.codeInstructionText}>They open Grocery Fetch → Profile → "Have a code?"</Text>
              </View>
              <View style={styles.codeInstructionRow}>
                <View style={styles.codeInstructionNum}><Text style={styles.codeInstructionNumText}>3</Text></View>
                <Text style={styles.codeInstructionText}>They enter the code and your lists sync instantly</Text>
              </View>
            </View>

            {/* Share button */}
            <TouchableOpacity
              style={styles.shareCodeBtn}
              onPress={() => {
                Share.share({
                  message: `Join my Grocery Fetch list! Enter code: ${displayCode} in the app.`,
                })
              }}
              activeOpacity={0.85}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <Path d="M16 6l-4-4-4 4" />
                <Line x1="12" y1="2" x2="12" y2="15" />
              </Svg>
              <Text style={styles.shareCodeBtnText}>Share code</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── JOIN HOUSEHOLD MODAL ── */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setJoinModalVisible(false)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Join a Household</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.joinModalBody}>
            {joinSuccess ? (
              /* Success state */
              <View style={styles.joinSuccessWrap}>
                <Text style={styles.joinSuccessEmoji}>🎉</Text>
                <Text style={styles.joinSuccessTitle}>You're in!</Text>
                <Text style={styles.joinSuccessSub}>Your list is now syncing in real time</Text>
              </View>
            ) : (
              <>
                <View style={styles.joinHeaderCard}>
                  <View style={[styles.householdIconWrap, { backgroundColor: colors.primaryLight, borderRadius: 14 }]}>
                    <KeyIcon />
                  </View>
                  <Text style={styles.joinTitle}>Enter invite code</Text>
                  <Text style={styles.joinSub}>
                    Ask the list owner to generate a code from their Profile tab
                  </Text>
                </View>

                {/* Code input */}
                <TextInput
                  style={styles.codeInput}
                  placeholder="A1B2C3"
                  placeholderTextColor={colors.textTertiary}
                  value={joinCode}
                  onChangeText={(t) => {
                    setJoinCode(t.toUpperCase())
                    setJoinError(null)
                  }}
                  autoCapitalize="characters"
                  maxLength={6}
                  keyboardType="default"
                  autoFocus
                />

                {joinError && (
                  <View style={styles.joinErrorCard}>
                    <Text style={styles.joinErrorText}>{joinError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    (joinCode.length !== 6 || joining) && styles.joinBtnDisabled,
                  ]}
                  onPress={handleJoin}
                  disabled={joinCode.length !== 6 || joining}
                  activeOpacity={0.85}
                >
                  {joining
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.joinBtnText}>Join household</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

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

  // ── Household ───────────────────────────────────────────────────────────
  householdLoadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },

  // Share your list card
  householdCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 14,
  },
  householdCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  householdIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdCardText: {
    flex: 1,
    gap: 2,
  },
  householdCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  householdCardSub: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  householdBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  householdBtnFull: {
    flex: 0,
  },
  householdBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  householdBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  householdBtnSecondary: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  householdBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Have a code row
  haveCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    gap: 12,
  },
  haveCodeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haveCodeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  haveCodeSub: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Active household card
  householdActiveCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    padding: 16,
    gap: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  householdActiveTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  householdActiveIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdActiveText: {
    flex: 1,
    gap: 2,
  },
  householdActiveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  householdActiveSub: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  householdActiveBadgeRow: {
    flexDirection: 'row',
  },
  householdActiveBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  householdActiveBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: colors.red,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  leaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
  },

  // ── Modals ─────────────────────────────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalCancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    width: 60,
  },
  modalCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalDoneBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'flex-end',
    width: 60,
  },
  modalDoneText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },

  // Invite code modal
  codeModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  codeDisplayCard: {
    backgroundColor: colors.heroDark,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  codeDisplayIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  codeDisplayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.4,
  },
  codeDisplayCode: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  codeDisplaySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  codeExpiresBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 4,
  },
  codeExpiresText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  codeInstructionsCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  codeInstructionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  codeInstructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  codeInstructionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  codeInstructionNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  codeInstructionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  shareCodeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareCodeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Join modal
  joinModalBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 16,
  },
  joinHeaderCard: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  joinTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  joinSub: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  codeInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.textPrimary,
  },
  joinErrorCard: {
    backgroundColor: colors.redLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  joinErrorText: {
    fontSize: 13,
    color: colors.red,
    lineHeight: 18,
    fontWeight: '500',
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnDisabled: {
    opacity: 0.45,
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  joinSuccessWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  joinSuccessEmoji: {
    fontSize: 64,
  },
  joinSuccessTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  joinSuccessSub: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
  },
})
