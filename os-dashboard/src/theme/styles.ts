import { colors, radii, shadows, transitions, type ColorMode } from './tokens';

export const globalStyles = {
  body: {
    margin: 0,
    background: colors.background,
    color: colors.textPrimary,
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    lineHeight: '1.5',
    WebkitFontSmoothing: 'antialiased' as const,
  },
  '*': {
    boxSizing: 'border-box' as const,
  },
};

export const glassSurface = (opacity = 0.06) => ({
  background: `rgba(20,20,20,${opacity + 0.9})`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid rgba(255,255,255,${opacity * 1.5})`,
});

export const cardStyles = {
  background: colors.surface,
  border: `1px solid ${colors.outline}`,
  borderRadius: radii.lg,
  padding: '20px',
  boxShadow: shadows.sm,
  transition: `all ${transitions.normal}`,
  ':hover': {
    borderColor: colors.goldDim,
    boxShadow: shadows.gold,
  },
};

export const inputStyles = {
  background: colors.surfaceVariant,
  border: `1px solid ${colors.outline}`,
  borderRadius: radii.md,
  padding: '10px 14px',
  color: colors.textPrimary,
  fontSize: '14px',
  outline: 'none',
  transition: `border-color ${transitions.fast}`,
  ':focus': {
    borderColor: colors.gold,
  },
  '::placeholder': {
    color: colors.textTertiary,
  },
};

export const buttonStyles = {
  primary: {
    background: colors.gold,
    color: '#000',
    border: 'none',
    borderRadius: radii.md,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },
  secondary: {
    background: 'transparent',
    color: colors.textPrimary,
    border: `1px solid ${colors.outline}`,
    borderRadius: radii.md,
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },
  ghost: {
    background: 'transparent',
    color: colors.textSecondary,
    border: 'none',
    borderRadius: radii.sm,
    padding: '6px 10px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: `all ${transitions.fast}`,
  },
};

export function getTheme(mode: ColorMode) {
  if (mode === 'light') {
    return {
      background: '#fafafa',
      surface: '#ffffff',
      surfaceVariant: '#f0f0f0',
      surfaceHover: '#e8e8e8',
      outline: '#e0e0e0',
      outlineVariant: '#d0d0d0',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textTertiary: '#999999',
      shadow: '0 1px 3px rgba(0,0,0,0.1)',
    };
  }
  return {
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    surfaceHover: colors.surfaceHover,
    outline: colors.outline,
    outlineVariant: colors.outlineVariant,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textTertiary,
    shadow: shadows.sm,
  };
}
