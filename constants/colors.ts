// constants/colors.ts
// Grocery Fetch Design System
// Base palette from brand colors — hybrid light/dark approach

export const colors = {
  // ─── Brand Palette (from design spec) ───────────────
  brand900: '#051F20',   // Deepest dark — login bg, overlays
  brand800: '#0B2B26',   // Very deep — dark card backgrounds
  brand700: '#163832',   // Deep forest — dark gradients
  brand600: '#235347',   // Forest green — primary buttons, active states
  brand300: '#8EB69B',   // Sage — accents, icons, borders
  brand100: '#DAF1DE',   // Mint — light backgrounds, badges

  // ─── Semantic Colors ────────────────────────────────
  primary: '#235347',         // Main interactive color
  primaryDark: '#163832',     // Pressed/hover state
  primaryLight: '#DAF1DE',    // Light backgrounds, selected states
  primaryMid: '#8EB69B',      // Mid tone for accents

  // ─── Gradients (use with LinearGradient) ────────────
  // Import: import { LinearGradient } from 'expo-linear-gradient'
  gradientHero: ['#051F20', '#163832'],          // Login, celebration screens
  gradientCard: ['#0B2B26', '#235347'],          // Dark feature cards
  gradientSubtle: ['#235347', '#8EB69B'],        // Subtle green gradient
  gradientMint: ['#8EB69B', '#DAF1DE'],          // Light mint gradient
  gradientSavings: ['#051F20', '#0B2B26', '#235347'], // Savings card

  // ─── Surface Colors (light mode UI) ─────────────────
  background: '#F8FAFB',      // App background (slightly warm white)
  surface: '#FFFFFF',         // Cards, inputs, sheets
  surfaceSecondary: '#F1F5F2',// Secondary card backgrounds (mint tint)
  surfaceDark: '#0B2B26',     // Dark cards, hero sections

  // ─── Text Colors ────────────────────────────────────
  textPrimary: '#051F20',     // Main text (deepest brand color)
  textSecondary: '#235347',   // Secondary text (mid green)
  textTertiary: '#8EB69B',    // Placeholder, disabled text
  textInverse: '#FFFFFF',     // Text on dark backgrounds
  textMint: '#DAF1DE',        // Text on darkest backgrounds

  // ─── Border Colors ───────────────────────────────────
  border: '#E2EDE5',          // Default borders (mint tinted)
  borderStrong: '#8EB69B',    // Active/focused borders
  borderDark: '#163832',      // Borders on dark surfaces

  // ─── Status Colors ───────────────────────────────────
  success: '#235347',         // Success states (use brand)
  successLight: '#DAF1DE',    // Success backgrounds
  warning: '#F59E0B',         // Warnings — amber (contrasts well with green)
  warningLight: '#FEF3C7',    // Warning backgrounds
  error: '#EF4444',           // Errors — red
  errorLight: '#FEE2E2',      // Error backgrounds
  savings: '#8EB69B',         // Savings amounts (sage)

  // ─── Store Brand Colors ──────────────────────────────
  shoprite: '#CC0000',
  stopAndShop: '#007A3D',
  target: '#E53935',
  walmart: '#0071CE',
  aldi: '#1E3A5F',

  // ─── Utility ─────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(5, 31, 32, 0.6)',      // Dark brand overlay
  overlayLight: 'rgba(5, 31, 32, 0.15)', // Light overlay for cards

  // ─── Legacy aliases (for compatibility) ──────────────
  dark: '#051F20',
  gray600: '#475569',
  gray400: '#94A3B8',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
}

// ─── Gradient Presets (ready to use with LinearGradient) ──
export const gradients = {
  hero: {
    colors: ['#051F20', '#163832'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  heroVertical: {
    colors: ['#051F20', '#0B2B26', '#235347'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  card: {
    colors: ['#0B2B26', '#235347'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  savingsCard: {
    colors: ['#051F20', '#0B2B26', '#235347'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  subtle: {
    colors: ['#235347', '#8EB69B'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  mint: {
    colors: ['#DAF1DE', '#F8FAFB'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  storeHeader: {
    colors: ['#163832', '#235347'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
}

export type ColorKey = keyof typeof colors
