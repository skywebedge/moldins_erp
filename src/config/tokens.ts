/**
 * MOLDINS ERP DESIGN TOKENS
 * Single Source of Truth for Colors, Typography, Spacing, and Component Dimensions
 * Strictly enforced across Factory & Civil Site Modules.
 */

export const DESIGN_TOKENS = {
  // LIGHT PALETTE
  palette: {
    bgPage: '#F8FAFC',
    bgSurface: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    // ONLY Accent Color
    brand: '#1E40AF',
    brandHover: '#1E3A8A',
    brandSubtle: '#EFF6FF',
    // Status Meanings ONLY
    success: '#15803D',
    successBg: '#F0FDF4',
    warning: '#B45309',
    warningBg: '#FFFBEB',
    danger: '#B91C1C',
    dangerBg: '#FEF2F2',
  },

  // DARK PALETTE EQUIVALENTS
  darkPalette: {
    bgPage: '#0B1220',
    bgSurface: '#111827',
    border: '#1F2937',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    brand: '#3B82F6',
    brandHover: '#60A5FA',
    brandSubtle: '#172554',
    success: '#22C55E',
    successBg: '#052E16',
    warning: '#F59E0B',
    warningBg: '#451A03',
    danger: '#EF4444',
    dangerBg: '#450A0A',
  },

  // TYPOGRAPHY SCALE
  typography: {
    pageTitle: { size: '24px', weight: 600, lineHeight: 1.3 },
    sectionTitle: { size: '16px', weight: 600, lineHeight: 1.4 },
    body: { size: '14px', weight: 400, lineHeight: 1.5 },
    table: { size: '14px', weight: 400, lineHeight: 1.5 },
    tableHeader: { size: '12px', weight: 600, tracking: '0.05em' },
    small: { size: '12px', weight: 400, lineHeight: 1.4 },
    hindiLineHeight: 1.7,
  },

  // SPACING SCALE (4, 8, 12, 16, 24, 32 ONLY)
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
  },

  // SHAPE & RADII
  radius: {
    card: '8px',
    input: '8px',
    button: '8px',
    badge: '999px',
  },

  // DIMENSIONS
  dimensions: {
    headerHeight: '56px',
    sidebarWidth: '240px',
    sidebarCollapsedWidth: '64px',
    contentMaxWidth: '1440px',
    contentPadding: '24px',
    tableRowHeight: '44px',
    kpiCardMaxHeight: '88px',
    buttonHeight: '36px',
    buttonTouchHeight: '44px',
    iconSize: 18,
    iconStrokeWidth: 1.75,
  },
} as const;

export const tokens = {
  colors: {
    brand: {
      DEFAULT: DESIGN_TOKENS.palette.brand,
      hover: DESIGN_TOKENS.palette.brandHover,
      subtle: DESIGN_TOKENS.palette.brandSubtle,
    },
    text: {
      primary: DESIGN_TOKENS.palette.textPrimary,
      secondary: DESIGN_TOKENS.palette.textSecondary,
      muted: DESIGN_TOKENS.palette.textMuted,
    },
    border: DESIGN_TOKENS.palette.border,
    success: DESIGN_TOKENS.palette.success,
    warning: DESIGN_TOKENS.palette.warning,
    danger: DESIGN_TOKENS.palette.danger,
  },
} as const;
