export const colors = {
  // Primary (Lime Green)
  primary: '#f3ffca',
  primaryContainer: '#cafd00',
  primaryDim: '#beee00',
  onPrimary: '#1a2000',
  onPrimaryContainer: '#1a2000',
  onPrimaryFixed: '#3a4a00',

  // Secondary (Cyan)
  secondary: '#00f4fe',
  secondaryContainer: '#00696e',
  secondaryDim: '#00e5ee',
  onSecondary: '#00575b',
  onSecondaryContainer: '#dffdff',

  // Tertiary (Gold)
  tertiary: '#ffe792',
  tertiaryContainer: '#ffd709',
  tertiaryDim: '#efc900',
  onTertiary: '#655400',
  onTertiaryContainer: '#5b4b00',

  // Error (Orange-Red)
  error: '#ff7351',
  errorContainer: '#b92902',
  errorDim: '#d53d18',
  onError: '#450900',
  onErrorContainer: '#ffd2c8',

  // Surfaces (Dark Theme)
  surface: '#0e0e10',
  surfaceDim: '#0e0e10',
  surfaceBright: '#2c2c2f',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#131315',
  surfaceContainer: '#19191c',
  surfaceContainerHigh: '#1f1f22',
  surfaceContainerHighest: '#262528',
  surfaceVariant: '#262528',
  surfaceTint: '#f3ffca',

  // On Surface
  onSurface: '#f9f5f8',
  onSurfaceVariant: '#adaaad',
  onBackground: '#f9f5f8',
  background: '#0e0e10',

  // Outline
  outline: '#918f92',
  outlineVariant: '#48474a',

  // Inverse
  inverseSurface: '#fcf8fb',
  inverseOnSurface: '#565557',
  inversePrimary: '#516700',

  // Rank colors
  bronze: '#cd7f32',

  // Semantic shortcuts
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Apply opacity to a hex color.
 * Usage: withOpacity(colors.secondary, 0.15) → '#00f4fe26'
 */
export function withOpacity(hex: string, opacity: number): string {
  const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + alpha;
}
