import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Avatar, Icon } from '../atoms';
import { colors, spacing } from '../../theme';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showAvatar?: boolean;
  avatarUri?: string;
  rightActions?: React.ReactNode;
}

export function TopAppBar({ title, showBack, onBack, showAvatar, avatarUri, rightActions }: TopAppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Icon name="back" size={24} color={colors.primaryContainer} />
          </TouchableOpacity>
        )}
        {showAvatar && <Avatar uri={avatarUri} size={40} borderColor="primaryContainer" />}
        {title ? (
          <Text variant="headlineSmall" color="primaryContainer" style={{ fontSize: 20 }}>{title}</Text>
        ) : (
          <Text variant="headlineMedium" color="primaryContainer" italic style={{ fontWeight: '900', letterSpacing: -1 }}>
            CLUTCH.GG
          </Text>
        )}
      </View>
      <View style={styles.right}>
        {rightActions ?? (
          <TouchableOpacity style={styles.iconBtn}>
            <Icon name="bell" size={24} color={colors.primary} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(14,14,16,0.8)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconBtn: { padding: spacing.sm },
});
