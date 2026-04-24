import {
  View,
  Text as RNText,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Platform,
  StyleSheet,
  Linking,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../theme';
import { fontMap } from '../../theme/fonts';
import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { getErrorMessage } from '../../utils/api-error';
import { AnimatedPressable, ShakeView, type ShakeRef } from '../../components/animated';
import { Icon } from '../../components/atoms';
import { useLogin } from '../../hooks/useAuth';

import { config } from '../../config';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();
  const shakeRef = useRef<ShakeRef>(null);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (!isFormValid) return;
    login.mutate(
      { email: email.trim(), password },
      {
        onError: async (error: unknown) => {
          const msg = await getErrorMessage(error, {
            401: 'Email o contraseña incorrectos',
          });
          shakeRef.current?.shake();
          Alert.alert('Error', msg);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ═══ TOP: Brand ═══ */}
        <View style={{ paddingTop: insets.top + screenHeight * 0.08 }}>
          <View style={styles.badge}>
            <RNText style={styles.badgeText}>Temporada 04 · Activa</RNText>
          </View>
          <RNText style={styles.title} accessibilityRole="header">CLUTCH.GG</RNText>
          <RNText style={styles.subtitle}>
            Eleva tu juego.{' '}
            <RNText style={styles.subtitleAccent}>Encuentra tu equipo.</RNText>
          </RNText>
        </View>

        {/* ═══ MIDDLE: Auth form ═══ */}
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>

          {/* Heading */}
          <View>
            <RNText style={styles.heading} accessibilityRole="header">Entra a la Arena</RNText>
            <RNText style={styles.headingSub}>
              Inicia sesión para continuar tu camino competitivo.
            </RNText>
          </View>

          {/* Social login — con iconos */}
          <View style={styles.socialRow}>
            <AnimatedPressable style={styles.socialButton} haptic="light" accessibilityRole="button" accessibilityLabel="Continuar con Google">
              <Icon name="google" size={22} color="#EA4335" />
            </AnimatedPressable>
            <AnimatedPressable style={styles.socialButton} haptic="light" accessibilityRole="button" accessibilityLabel="Continuar con Apple">
              <Icon name="apple" size={24} color={colors.black} />
            </AnimatedPressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <RNText style={styles.dividerText}>o continúa con email</RNText>
            <View style={styles.dividerLine} />
          </View>

          {/* Fields */}
          <ShakeView ref={shakeRef}>
            <View style={styles.fieldGroup}>
              <RNText style={styles.fieldLabel}>Email</RNText>
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor={withOpacity(colors.outline, 0.5)}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={colors.secondary}
                style={styles.textInput}
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.passwordGroup}>
              <RNText style={styles.fieldLabel}>Contraseña</RNText>
              <View style={styles.passwordInputRow}>
                <TextInput
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor={withOpacity(colors.outline, 0.5)}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  selectionColor={colors.secondary}
                  style={styles.passwordTextInput}
                  accessibilityLabel="Contraseña"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color={colors.outline} />
                </Pressable>
              </View>
            </View>
          </ShakeView>

          {/* CTA — siempre verde lima, opacity baja si disabled */}
          <AnimatedPressable
            onPress={handleLogin}
            scaleDown={0.95}
            haptic="medium"
            disabled={!isFormValid || login.isPending}
            style={[buttonStyles.primary, (!isFormValid || login.isPending) ? { opacity: 0.5 } : undefined]}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            <RNText style={buttonStyles.primaryText}>
              {login.isPending ? 'Conectando...' : 'Iniciar Sesión'}
            </RNText>
          </AnimatedPressable>

          {/* Forgot password — DEBAJO del CTA */}
          <AnimatedPressable
            onPress={() => Alert.alert('Recuperar contraseña', 'Enviaremos un enlace a tu email.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Enviar', onPress: () => email.trim() ? Alert.alert('Enviado', 'Revisa tu bandeja.') : Alert.alert('Error', 'Ingresa tu email primero.') },
            ])}
            haptic="light"
            style={styles.forgotButton}
            accessibilityRole="button"
            accessibilityLabel="Recuperar contraseña"
          >
            <RNText style={styles.forgotLink}>¿Olvidaste tu contraseña?</RNText>
          </AnimatedPressable>

          {/* Create account */}
          <View style={styles.footer}>
            <RNText style={styles.footerText}>¿Nuevo en la liga?</RNText>
            <AnimatedPressable
              onPress={() => router.push('/(auth)/create-profile')}
              haptic="light"
              accessibilityRole="link"
              accessibilityLabel="Crear cuenta"
            >
              <RNText style={styles.footerLink}>Crear Cuenta</RNText>
            </AnimatedPressable>
          </View>
        </View>

        {/* ═══ BOTTOM: Legal ═══ */}
        <View style={{ paddingBottom: insets.bottom + 16 }}>
          <View style={styles.bottomLinks}>
            <RNText style={styles.bottomLinkText} onPress={() => Linking.openURL(config.termsUrl)} accessibilityRole="link" accessibilityLabel="Términos y condiciones">Términos</RNText>
            <RNText style={styles.bottomLinkDot}>·</RNText>
            <RNText style={styles.bottomLinkText} onPress={() => Linking.openURL(config.privacyUrl)} accessibilityRole="link" accessibilityLabel="Política de privacidad">Privacidad</RNText>
            <RNText style={styles.bottomLinkDot}>·</RNText>
            <RNText style={styles.bottomLinkText} onPress={() => Linking.openURL(config.statusUrl)} accessibilityRole="link" accessibilityLabel="Estado del servicio">Estado</RNText>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Brand ──
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: withOpacity(colors.primaryContainer, 0.15),
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderCurve: 'continuous',
  },
  badgeText: {
    fontFamily: fontMap.Lexend['700'],
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryContainer,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 56,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -2,
    color: colors.primary,
    lineHeight: 64,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fontMap.Manrope['300'],
    fontSize: 18,
    fontWeight: '300',
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    lineHeight: 26,
  },
  subtitleAccent: {
    fontFamily: fontMap.Manrope['600'],
    fontWeight: '600',
    color: colors.secondary,
  },

  // ── Heading ──
  heading: {
    fontFamily: fontMap.SpaceGrotesk['700'],
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: -0.5,
  },
  headingSub: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 20,
  },

  // ── Social ──
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: withOpacity(colors.outlineVariant, 0.4),
  },
  dividerText: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 12,
    color: colors.outline,
  },

  // ── Fields ──
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fontMap.Manrope['600'],
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: withOpacity(colors.white, 0.15),
    fontFamily: fontMap.Manrope['400'],
    fontSize: 15,
    color: colors.onSurface,
  },
  passwordGroup: {
    gap: 6,
    marginTop: spacing.lg,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: withOpacity(colors.white, 0.15),
  },
  passwordTextInput: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 20,
    paddingRight: 8,
    fontFamily: fontMap.Manrope['400'],
    fontSize: 15,
    color: colors.onSurface,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  // ── Forgot (debajo del CTA) ──
  forgotButton: {
    alignSelf: 'center',
  },
  forgotLink: {
    fontFamily: fontMap.Manrope['500'],
    fontSize: 13,
    color: colors.secondary,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: fontMap.Manrope['400'],
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  footerLink: {
    fontFamily: fontMap.Manrope['700'],
    fontWeight: '700',
    fontSize: 14,
    color: colors.primaryContainer,
  },

  // ── Legal links ──
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  bottomLinkText: {
    fontFamily: fontMap.Manrope['500'],
    fontSize: 12,
    color: colors.outline,
  },
  bottomLinkDot: {
    fontSize: 12,
    color: colors.outlineVariant,
  },
});
