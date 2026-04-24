import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon } from '../../components/atoms';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../theme';
import { useState } from 'react';
import { Alert } from 'react-native';
import { getErrorMessage } from '../../utils/api-error';
import { AnimatedPressable, StaggeredItem } from '../../components/animated';
import { useRegister } from '../../hooks/useAuth';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Image as ExpoImage } from 'expo-image';

export default function CreateProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const { pickAndUpload, uploading } = useImageUpload();
  const [city, setCity] = useState('');
  const register = useRegister();

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().includes('@') &&
    password.length >= 8;

  const handleCreate = () => {
    if (!isFormValid) return;
    register.mutate(
      { email: email.trim(), password, name: name.trim() },
      {
        onError: async (error: unknown) => {
          const msg = await getErrorMessage(error, {
            409: 'Este email ya está registrado',
          });
          Alert.alert('Error', msg);
        },
      },
    );
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <StaggeredItem index={0}>
        <Text
          variant="headlineLarge"
          color="onSurface"
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          Crea Tu{' '}
          <Text
            variant="headlineLarge"
            color="primaryContainer"
            style={styles.headerTitle}
          >
            Perfil
          </Text>
        </Text>

        <Text
          variant="bodyMedium"
          color="onSurfaceVariant"
          style={styles.headerSub}
        >
          Configura tu identidad de jugador.
        </Text>
      </StaggeredItem>

      {/* Avatar */}
      <StaggeredItem index={1}>
        <View style={styles.avatarContainer}>
          <AnimatedPressable
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel="Seleccionar foto de perfil"
            onPress={async () => {
              const url = await pickAndUpload();
              if (url) setAvatarUri(url);
            }}
            disabled={uploading}
          >
            <View style={styles.avatarCircle}>
              {avatarUri ? (
                <ExpoImage source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Icon name="person" size={36} color={colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
              )}
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color={colors.primaryContainer} />
                </View>
              )}
            </View>

            {/* Camera badge */}
            <View style={styles.cameraBadge}>
              <Icon name={uploading ? 'time' : 'camera'} size={16} color={colors.onPrimaryContainer} />
            </View>
          </AnimatedPressable>
        </View>
      </StaggeredItem>

      {/* Inputs */}
      <View style={styles.inputsContainer}>
        {/* Nombre de Jugador */}
        <StaggeredItem index={2}>
          <View style={styles.fieldGroup}>
            <Text variant="labelSmall" style={styles.fieldLabel}>
              Nombre de Jugador
            </Text>
            <TextInput
              placeholder="Tu nombre visible"
              placeholderTextColor={withOpacity(colors.outline, 0.5)}
              value={name}
              onChangeText={setName}
              style={styles.textInput}
              selectionColor={colors.secondary}
              accessibilityLabel="Nombre de jugador"
            />
          </View>
        </StaggeredItem>

        {/* Email */}
        <StaggeredItem index={3}>
          <View style={styles.fieldGroup}>
            <Text variant="labelSmall" style={styles.fieldLabel}>
              Email
            </Text>
            <TextInput
              placeholder="tu@email.com"
              placeholderTextColor={withOpacity(colors.outline, 0.5)}
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              selectionColor={colors.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />
          </View>
        </StaggeredItem>

        {/* Contraseña */}
        <StaggeredItem index={4}>
          <View style={styles.fieldGroup}>
            <Text variant="labelSmall" style={styles.fieldLabel}>
              Contraseña
            </Text>
            <TextInput
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={withOpacity(colors.outline, 0.5)}
              value={password}
              onChangeText={setPassword}
              style={styles.textInput}
              selectionColor={colors.secondary}
              secureTextEntry
              accessibilityLabel="Contraseña"
            />
          </View>
        </StaggeredItem>
      </View>

      {/* CTA Button */}
      <AnimatedPressable
        onPress={handleCreate}
        scaleDown={0.95}
        haptic="medium"
        disabled={!isFormValid || register.isPending}
        style={[buttonStyles.primary, (!isFormValid || register.isPending) ? buttonStyles.disabled : undefined]}
        accessibilityRole="button"
        accessibilityLabel="Entrar a la arena"
        accessibilityState={{ disabled: !isFormValid }}
      >
        <Text style={[buttonStyles.primaryText, (!isFormValid || register.isPending) && buttonStyles.disabledText]}>
          {register.isPending ? 'Creando cuenta...' : 'Entrar a la Arena'}
        </Text>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => router.back()}
        haptic="light"
        style={{ alignItems: 'center', marginTop: 24 }}
        accessibilityRole="link"
        accessibilityLabel="Volver a iniciar sesión"
      >
        <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurfaceVariant }}>
          ¿Ya tienes cuenta?{' '}
          <Text style={{ fontFamily: 'Manrope_700Bold', color: colors.primaryContainer }}>Iniciar Sesión</Text>
        </Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  headerSub: {
    marginTop: 4,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 3,
    borderColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarEmoji: {
    fontSize: 36,
    opacity: 0.3,
    color: colors.onSurfaceVariant,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  cameraBadgeIcon: {
    fontSize: 16,
    color: colors.onPrimaryContainer,
  },
  inputsContainer: {
    marginTop: spacing['2xl'],
    gap: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontFamily: 'Lexend_900Black',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  ctaButton: {
    marginTop: spacing['3xl'],
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: radii.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow('ctaLime'),
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaButtonText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.onPrimary,
  },
});
