// ─── Color Palette ───────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#0A0A0F',
  surface: '#0F0F17',
  surface2: '#13131E',
  surface3: '#1A1A28',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGlow: 'rgba(124, 92, 255, 0.45)',

  // Brand — neon purple
  accent: '#7C5CFF',
  accentGlow: 'rgba(124, 92, 255, 0.20)',
  accentDim: 'rgba(124, 92, 255, 0.10)',
  accentText: '#A48BFF',
  accentBright: '#A48BFF',
  cyan: '#22D3EE',

  // Semantic
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.12)',
  warning: '#F59E0B',
  warningDim: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.12)',

  // Text hierarchy
  text: '#FFFFFF',
  textSecondary: '#9898B2',
  textMuted: '#5A5A78',
  textSubtle: '#30304A',

  // Category
  trt: '#7C5CFF',
  peptide: '#22D3EE',
  supplement: '#F59E0B',

  // Transparent helpers
  white6: 'rgba(255,255,255,0.06)',
  white10: 'rgba(255,255,255,0.10)',
  white16: 'rgba(255,255,255,0.16)',
};

// ─── Spacing (8pt grid) ───────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

// ─── Shadows / Glow ───────────────────────────────────────────────────────────

export const glow = {
  accent: {
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
};

// ─── Category helpers ─────────────────────────────────────────────────────────

export function categoryColor(cat: string): string {
  if (cat === 'TRT') return colors.trt;
  if (cat === 'Peptide') return colors.peptide;
  return colors.supplement;
}
