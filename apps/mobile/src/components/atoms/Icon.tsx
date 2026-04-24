// @ts-expect-error — @expo/vector-icons has no dedicated type exports per icon set
import Ionicons from '@expo/vector-icons/Ionicons';
// @ts-expect-error — @expo/vector-icons has no dedicated type exports per icon set
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ViewStyle } from 'react-native';
import { colors } from '../../theme';

/**
 * Mapping centralizado de nombres de iconos de la app
 * a sus componentes de @expo/vector-icons.
 *
 * Uso: <Icon name="search" size={22} color={colors.outline} />
 */

const ICON_MAP = {
  // Navigation / tabs
  search: { set: 'ion', name: 'search-outline' },
  soccer: { set: 'mci', name: 'soccer' },
  person: { set: 'ion', name: 'person-outline' },
  'person-fill': { set: 'ion', name: 'person' },

  // Actions
  bell: { set: 'ion', name: 'notifications-outline' },
  'bell-fill': { set: 'ion', name: 'notifications' },
  settings: { set: 'ion', name: 'settings-outline' },
  back: { set: 'ion', name: 'chevron-back' },
  close: { set: 'ion', name: 'close' },
  add: { set: 'ion', name: 'add' },
  share: { set: 'ion', name: 'share-outline' },
  check: { set: 'ion', name: 'checkmark' },
  'check-circle': { set: 'ion', name: 'checkmark-circle' },

  // Sports / game
  trophy: { set: 'ion', name: 'trophy-outline' },
  'trophy-fill': { set: 'ion', name: 'trophy' },
  shield: { set: 'ion', name: 'shield-outline' },
  'shield-fill': { set: 'ion', name: 'shield' },
  people: { set: 'ion', name: 'people-outline' },
  'people-fill': { set: 'ion', name: 'people' },
  flame: { set: 'ion', name: 'flame-outline' },
  'flame-fill': { set: 'ion', name: 'flame' },
  star: { set: 'ion', name: 'star' },
  'star-outline': { set: 'ion', name: 'star-outline' },
  scale: { set: 'mci', name: 'scale-balance' },
  whistle: { set: 'mci', name: 'whistle' },
  'cards-playing': { set: 'mci', name: 'cards-playing-outline' },
  crown: { set: 'mci', name: 'crown' },
  diamond: { set: 'mci', name: 'diamond-stone' },
  menu: { set: 'ion', name: 'menu-outline' },
  camera: { set: 'ion', name: 'camera-outline' },
  'chat-bubble': { set: 'ion', name: 'chatbubble-outline' },

  // Date / time
  calendar: { set: 'ion', name: 'calendar-outline' },
  time: { set: 'ion', name: 'time-outline' },
  clock: { set: 'ion', name: 'time-outline' },

  // UI
  bolt: { set: 'ion', name: 'flash' },
  warning: { set: 'ion', name: 'warning-outline' },
  eye: { set: 'ion', name: 'eye-outline' },
  'eye-off': { set: 'ion', name: 'eye-off-outline' },
  location: { set: 'ion', name: 'location-outline' },
  filter: { set: 'ion', name: 'filter' },
  'arrow-up': { set: 'ion', name: 'arrow-up' },
  'arrow-down': { set: 'ion', name: 'arrow-down' },
  map: { set: 'ion', name: 'map-outline' },
  podium: { set: 'ion', name: 'podium-outline' },

  // Auth / social
  google: { set: 'ion', name: 'logo-google' },
  apple: { set: 'ion', name: 'logo-apple' },
  mail: { set: 'ion', name: 'mail-outline' },
  lock: { set: 'ion', name: 'lock-closed-outline' },
  logout: { set: 'ion', name: 'log-out-outline' },
  trash: { set: 'ion', name: 'trash-outline' },

  // Status
  'circle-fill': { set: 'ion', name: 'ellipse' },
  'info-circle': { set: 'ion', name: 'information-circle-outline' },
  document: { set: 'ion', name: 'document-text-outline' },
  pencil: { set: 'ion', name: 'pencil-outline' },
  'chevron-forward': { set: 'ion', name: 'chevron-forward' },
} as const;

type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function Icon({ name, size = 24, color = colors.onSurface, style }: IconProps) {
  const entry = ICON_MAP[name];

  if (entry.set === 'mci') {
    return (
      <MaterialCommunityIcons
        name={entry.name as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <Ionicons
      name={entry.name as any}
      size={size}
      color={color}
      style={style}
    />
  );
}
