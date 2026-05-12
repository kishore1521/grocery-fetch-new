// constants/colors.ts
// Grocery Fetch Design System — Fintech/Consumer Style

export const colors = {
  // ─── Brand greens ──────────────────────────────────
  primary:        '#00A651',   // buttons, icons, accents
  primaryDark:    '#007A3D',   // hover, gradient end
  primaryLight:   '#E8F5EE',   // tinted backgrounds
  primaryGlow:    'rgba(0,166,81,0.15)', // focus rings

  // ─── Hero gradient ─────────────────────────────────
  heroDark:       '#003D20',
  heroMid:        '#006B35',
  heroLight:      '#00A651',

  // ─── Accent ────────────────────────────────────────
  orange:         '#F97316',
  orangeLight:    '#FFF3ED',
  red:            '#EF4444',
  redLight:       '#FFF5F5',
  blue:           '#2563EB',

  // ─── Text ──────────────────────────────────────────
  textPrimary:    '#0F172A',
  textSecondary:  '#475569',
  textTertiary:   '#94A3B8',
  textInverse:    '#FFFFFF',

  // ─── Surfaces ──────────────────────────────────────
  background:     '#F8FAFC',
  surface:        '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceTertiary:  '#F8FAFC',

  // ─── Borders ───────────────────────────────────────
  border:         '#E2E8F0',
  borderStrong:   '#CBD5E1',

  // ─── Status ────────────────────────────────────────
  success:        '#00A651',
  successLight:   '#E8F5EE',
  warning:        '#F97316',
  warningLight:   '#FFF3ED',
  error:          '#EF4444',
  errorLight:     '#FFF5F5',

  // ─── Store brand colors ────────────────────────────
  shoprite:       '#CC0000',
  stopAndShop:    '#007A3D',
  target:         '#E53935',
  walmart:        '#0071CE',
  aldi:           '#1E3A5F',
  bjs:            '#0047AB',
  costco:         '#005DAA',

  // ─── Utility ──────────────────────────────────────
  white:          '#FFFFFF',
  black:          '#0F172A',
  transparent:    'transparent',
  overlay:        'rgba(15,23,42,0.5)',

  // ─── Backward-compat aliases ──────────────────────
  dark:           '#0F172A',
  gray400:        '#94A3B8',
  gray200:        '#E2E8F0',
  brand300:       '#94A3B8',

  // Old Direction C aliases (keep for onboarding/auth stubs)
  primaryBorder:  '#BBF7D0',
}

export type ColorKey = keyof typeof colors
