import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/colors'

function SearchBigIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none"
      stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round">
      <Circle cx="11" cy="11" r="8" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}

export default function SearchScreen() {
  const { t } = useTranslation()
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
            <Text style={styles.heroLabel}>{t('search.heroLabel')}</Text>
            <Text style={styles.heroTitle}>{t('search.heroTitle')}</Text>
            <Text style={styles.heroSub}>{t('search.heroSub')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── WHITE SHEET ── */}
      <View style={styles.sheetContainer}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <SearchBigIcon />
          </View>
          <Text style={styles.emptyTitle}>{t('search.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('search.emptySub')}</Text>
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: 10,
    left: -20,
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
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 6,
    fontWeight: '500',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 21,
  },
})
