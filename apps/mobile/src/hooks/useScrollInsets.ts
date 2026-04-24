import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../theme';

type ScrollContext =
  | 'tab'         // Inside tab navigator (tab bar overlaps bottom)
  | 'stack'       // Regular stack screen (no bottom overlay)
  | 'bottomBar'   // Has absolute-positioned bottom action bar
  | 'fab';        // Has FAB floating at bottom

/**
 * Returns dynamic paddingTop / paddingBottom for ScrollView contentContainerStyle.
 *
 * Derives values from actual element heights + device safe area insets
 * instead of hardcoded magic numbers.
 *
 * Usage:
 *   const scroll = useScrollInsets('tab');
 *   <ScrollView contentContainerStyle={{ paddingTop: scroll.top, paddingBottom: scroll.bottom }}>
 */
export function useScrollInsets(
  context: ScrollContext,
  options?: { hasAppBar?: boolean },
) {
  const insets = useSafeAreaInsets();

  const hasAppBar = options?.hasAppBar ?? true;

  // Top: app bar height + safe area, or just safe area
  const top = hasAppBar
    ? insets.top + layout.APP_BAR + layout.SCROLL_BUFFER
    : insets.top + layout.SCROLL_BUFFER;

  // Bottom: depends on what overlaps the scroll from below
  let bottom: number;
  switch (context) {
    case 'tab':
      // Tab bar is 84pt; Tabs layout already reserves space,
      // but content behind absolute app bars needs extra clearance
      bottom = layout.SCROLL_BUFFER + insets.bottom;
      break;
    case 'bottomBar':
      // Absolute bottom bar (CTA, publish, etc.)
      bottom = layout.BOTTOM_BAR + insets.bottom + layout.SCROLL_BUFFER;
      break;
    case 'fab':
      // FAB floats over content
      bottom = layout.FAB_CLEARANCE + insets.bottom + layout.SCROLL_BUFFER;
      break;
    case 'stack':
    default:
      // Simple stack screen, just safe area
      bottom = insets.bottom + layout.SCROLL_BUFFER;
      break;
  }

  return { top, bottom, insets };
}
