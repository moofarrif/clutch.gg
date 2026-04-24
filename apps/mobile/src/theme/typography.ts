import { TextStyle } from 'react-native';

export const fontFamilies = {
  headline: 'SpaceGrotesk',
  body: 'Manrope',
  label: 'Lexend',
} as const;

export const fontWeights = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
};

export const textStyles = {
  // Headlines (Space Grotesk) - titles, scores, names
  displayLarge: {
    fontFamily: fontFamilies.headline,
    fontSize: 72,
    fontWeight: fontWeights.black,
    letterSpacing: -2,
    textTransform: 'uppercase' as const,
  },
  displayMedium: {
    fontFamily: fontFamilies.headline,
    fontSize: 48,
    fontWeight: fontWeights.black,
    letterSpacing: -1.5,
    textTransform: 'uppercase' as const,
  },
  headlineLarge: {
    fontFamily: fontFamilies.headline,
    fontSize: 32,
    fontWeight: fontWeights.extrabold,
    letterSpacing: -1,
    textTransform: 'uppercase' as const,
  },
  headlineMedium: {
    fontFamily: fontFamilies.headline,
    fontSize: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
    textTransform: 'uppercase' as const,
  },
  headlineSmall: {
    fontFamily: fontFamilies.headline,
    fontSize: 20,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
    textTransform: 'uppercase' as const,
  },

  // Score display
  score: {
    fontFamily: fontFamilies.headline,
    fontSize: 40,
    fontWeight: fontWeights.black,
    letterSpacing: -1,
    fontStyle: 'italic' as const,
  },

  // Body (Manrope) - descriptions, paragraphs
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
  },

  // Labels (Lexend) - badges, metadata, buttons
  labelLarge: {
    fontFamily: fontFamilies.label,
    fontSize: 14,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  labelMedium: {
    fontFamily: fontFamilies.label,
    fontSize: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  labelSmall: {
    fontFamily: fontFamilies.label,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  labelTiny: {
    fontFamily: fontFamilies.label,
    fontSize: 8,
    fontWeight: fontWeights.bold,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TextVariant = keyof typeof textStyles;
