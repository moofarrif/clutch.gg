import { View, ScrollView, Switch, Alert, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon } from '../../components/atoms';
import { UserAvatar } from '../../components/atoms';
import { AnimatedPressable } from '../../components/animated';
import { useAuthStore } from '../../stores/auth';
import { useLogout } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { api } from '../../services/api';
import { getErrorMessage } from '../../utils/api-error';
import { colors, spacing, radii, shadow, withOpacity } from '../../theme';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Icon>['name'];

import { config } from '../../config';

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  danger,
  showChevron = false,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      haptic="light"
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={danger ? colors.error : colors.onSurfaceVariant} />
        <Text style={[styles.rowLabel, danger && { color: colors.error }]}>{label}</Text>
      </View>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : showChevron || (!value && onPress) ? (
        <Icon name="chevron-forward" size={16} color={colors.outlineVariant} />
      ) : null}
    </AnimatedPressable>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Icon name={icon} size={20} color={colors.onSurfaceVariant} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceContainerHighest, true: withOpacity(colors.primaryDim, 0.45) }}
        thumbColor={value ? colors.primaryContainer : colors.onSurfaceVariant}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { data: profile } = useProfile();

  const currentUser = profile ?? user;

  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchReminder, setMatchReminder] = useState(true);
  const [joinNotify, setJoinNotify] = useState(true);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.pushEnabled !== undefined) setPushEnabled(currentUser.pushEnabled);
      if (currentUser.matchReminder !== undefined) setMatchReminder(currentUser.matchReminder);
      if (currentUser.joinNotify !== undefined) setJoinNotify(currentUser.joinNotify);
    }
  }, [currentUser]);

  const savePreference = (key: string, value: boolean) => {
    api.patch('users/me/preferences', { json: { [key]: value } }).catch(() => {});
  };
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => logout.mutate(undefined, {
            onError: async (error: unknown) => {
              const msg = await getErrorMessage(error);
              Alert.alert('Error', msg);
            },
          }),
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. Se borrarán todos tus datos, partidos e historial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            api.delete('users/me').catch(() => {});
            logout.mutate(undefined, {
              onError: async (error: unknown) => {
                const msg = await getErrorMessage(error);
                Alert.alert('Error', msg);
              },
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* App Bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }, shadow('appBar')]}>
        <AnimatedPressable onPress={() => router.back()} haptic="light" accessibilityRole="button" accessibilityLabel="Volver">
          <Icon name="back" size={24} color={colors.primaryContainer} />
        </AnimatedPressable>
        <Text style={styles.title} accessibilityRole="header">Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: spacing.xl,
        }}
      >
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <UserAvatar
            photoUrl={currentUser?.photoUrl}
            name={currentUser?.name}
            size={72}
            borderColor={colors.primaryContainer}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name ?? '—'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email ?? '—'}</Text>
            {currentUser?.city ? (
              <View style={styles.profileCityRow}>
                <Icon name="location" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.profileCity}>{currentUser.city}</Text>
              </View>
            ) : null}
          </View>
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/profile')}
            haptic="light"
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Icon name="pencil" size={16} color={colors.primaryContainer} />
          </AnimatedPressable>
        </View>

        {/* Notificaciones */}
        <Text style={styles.sectionTitle} accessibilityRole="header">Notificaciones</Text>
        <View style={styles.section}>
          <SettingsToggle
            icon="bell"
            label="Push notifications"
            value={pushEnabled}
            onToggle={(v) => { setPushEnabled(v); savePreference('pushEnabled', v); }}
          />
          <SettingsToggle
            icon="time"
            label="Recordatorio de partido"
            value={matchReminder}
            onToggle={(v) => { setMatchReminder(v); savePreference('matchReminder', v); }}
          />
          <SettingsToggle
            icon="people"
            label="Alguien se unió"
            value={joinNotify}
            onToggle={(v) => { setJoinNotify(v); savePreference('joinNotify', v); }}
          />
        </View>

        {/* App + Sesión merged */}
        <Text style={styles.sectionTitle} accessibilityRole="header">App</Text>
        <View style={styles.section}>
          <SettingsRow icon="document" label="Términos y condiciones" onPress={() => Linking.openURL(config.termsUrl)} />
          <SettingsRow icon="lock" label="Política de privacidad" onPress={() => Linking.openURL(config.privacyUrl)} />
          <SettingsRow icon="mail" label="Soporte" onPress={() => Linking.openURL('mailto:soporte@clutch.gg')} />
          <SettingsRow icon="info-circle" label="Versión" value={appVersion} />
          <View style={styles.sectionDivider} />
          <SettingsRow icon="logout" label="Cerrar sesión" onPress={handleLogout} danger />
        </View>

        {/* Zona de peligro */}
        <View style={[styles.section, styles.dangerSection]}>
          <SettingsRow icon="trash" label="Eliminar cuenta" onPress={handleDeleteAccount} danger />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: withOpacity(colors.background, 0.8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: colors.primaryContainer,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },

  /* ─── Profile Hero ─── */
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  profileCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  profileCity: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: withOpacity(colors.primaryContainer, 0.12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ─── Sections ─── */
  sectionTitle: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  section: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: withOpacity(colors.outlineVariant, 0.25),
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  dangerSection: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: withOpacity(colors.error, 0.35),
    backgroundColor: withOpacity(colors.error, 0.05),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: withOpacity(colors.outlineVariant, 0.1),
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 15,
    color: colors.onSurface,
  },
  rowValue: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
});
