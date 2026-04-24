export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/**
 * Heights of overlapping UI elements.
 * Used to calculate dynamic paddingBottom/paddingTop for ScrollViews.
 *
 * Tab bar total height = TAB_BAR + insets.bottom (already handled by Tabs layout)
 * App bar total height = APP_BAR + insets.top
 * Bottom bar total height = BOTTOM_BAR + insets.bottom
 */
export const layout = {
  /** Tab bar intrinsic height (without safe area) */
  TAB_BAR: 84,
  /** Standard top app bar height (without safe area) */
  APP_BAR: 64,
  /** Bottom action bar height (Publicar, CTA, etc.) */
  BOTTOM_BAR: 72,
  /** FAB size + margin from bottom */
  FAB_CLEARANCE: 80,
  /** Extra breathing room below last scroll item */
  SCROLL_BUFFER: 16,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
