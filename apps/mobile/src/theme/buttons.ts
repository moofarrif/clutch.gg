import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { radii, spacing } from './spacing';
import { shadow } from './shadows';

/**
 * Shared button styles for the entire app.
 * Import: import { buttonStyles } from '../../theme';
 *
 * Usage:
 *   <Pressable style={[buttonStyles.primary, disabled && buttonStyles.disabled]}>
 *     <Text style={[buttonStyles.primaryText, disabled && buttonStyles.disabledText]}>
 */
export const buttonStyles = StyleSheet.create({
  // ── Primary (Lime CTA) ──
  primary: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    ...shadow('ctaLime'),
  },
  primaryText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.onPrimaryContainer,
    textTransform: 'uppercase',
  },

  // ── Secondary (Cyan) ──
  secondary: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.onSecondary,
    textTransform: 'uppercase',
  },

  // ── Ghost (transparent bg, surface border) ──
  ghost: {
    backgroundColor: colors.surfaceContainerHighest,
    paddingVertical: 16,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.onSurface,
    textTransform: 'uppercase',
  },

  // ── Accent (White — invitations, special actions) ──
  accent: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.black,
    textTransform: 'uppercase',
  },

  // ── Danger (Error — destructive actions) ──
  danger: {
    backgroundColor: colors.errorContainer,
    paddingVertical: 14,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.onErrorContainer,
    textTransform: 'uppercase',
  },

  // ── Disabled (applies on top of any variant) ──
  disabled: {
    backgroundColor: colors.surfaceContainerHigh,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: colors.outlineVariant,
  },
});
