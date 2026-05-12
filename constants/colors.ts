// constants/colors.ts
// Grocery Fetch Design System — Direction C

export const colors = {
  // ─── Primary ──────────────────────────────────────
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#F0FDF4',
  primaryBorder: '#BBF7D0',

  // ─── Text ─────────────────────────────────────────
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // ─── Surfaces ─────────────────────────────────────
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  surfaceTertiary: '#F8F9FA',

  // ─── Borders ──────────────────────────────────────
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // ─── Status ───────────────────────────────────────
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  savings: '#16A34A',

  // ─── Store brand colors ───────────────────────────
  shoprite: '#CC0000',
  stopAndShop: '#007A3D',
  target: '#E53935',
  walmart: '#0071CE',
  aldi: '#1E3A5F',
  bjs: '#0047AB',
  costco: '#005DAA',

  // ─── Utility ─────────────────────────────────────
  white: '#FFFFFF',
  black: '#111827',
  transparent: 'transparent',
  overlay: 'rgba(17,24,39,0.5)',

  // ─── Backward-compat aliases ──────────────────────
  // Used by auth, profile, store/product stubs, tab layout
  dark: '#111827',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  brand300: '#9CA3AF',
}

export type ColorKey = keyof typeof colors
