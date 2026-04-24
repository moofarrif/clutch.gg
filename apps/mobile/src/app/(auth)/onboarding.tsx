import { useRef, useState } from 'react';
import { View, FlatList, useWindowDimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AnimatedPressable } from '../../components/animated';
import { Icon } from '../../components/atoms';
import { useOnboarding } from '../../hooks/useOnboarding';
import { colors, spacing } from '../../theme';

const SLIDES = [
  {
    id: '1',
    iconName: 'location' as const,
    title: 'Encuentra partidos\ncerca de ti',
    description: 'Usa tu ubicación para descubrir partidos de fútbol 5v5 en canchas sintéticas cercanas.',
    accent: colors.secondary,
  },
  {
    id: '2',
    iconName: 'scale' as const,
    title: 'Equipos\nbalanceados',
    description: 'Nuestro sistema de MMR arma equipos parejos automáticamente. Cada partido es competitivo.',
    accent: colors.primaryContainer,
  },
  {
    id: '3',
    iconName: 'trophy' as const,
    title: 'Sube de\nrango',
    description: 'Gana partidos para subir tu ELO. De Bronce a Diamante — demuestra tu nivel.',
    accent: colors.tertiaryContainer,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === SLIDES.length - 1;

  const requestPermissions = async () => {
    // Request location permission (non-blocking)
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}

    // Request notification permission (non-blocking)
    try {
      await Notifications.requestPermissionsAsync();
    } catch {}
  };

  const finishOnboarding = async () => {
    await requestPermissions();
    await completeOnboarding();
    router.replace('/(auth)/sign-in');
  };

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* Skip button */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.skipContainer}>
        <AnimatedPressable onPress={handleSkip} haptic="light" style={styles.skipButton}>
          <Animated.Text style={styles.skipText}>SALTAR</Animated.Text>
        </AnimatedPressable>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.slide, { width }]}>
            <Animated.View
              entering={FadeInUp.delay(index * 100).duration(300)}
              style={styles.iconWrap}
            >
              <Icon name={item.iconName} size={80} color={item.accent} />
            </Animated.View>
            <Animated.Text
              entering={FadeInUp.delay(index * 100 + 100).duration(300)}
              style={[styles.title, { color: item.accent }]}
            >
              {item.title}
            </Animated.Text>
            <Animated.Text
              entering={FadeInUp.delay(index * 100 + 200).duration(300)}
              style={styles.description}
            >
              {item.description}
            </Animated.Text>
          </View>
        )}
      />

      {/* Dots + CTA */}
      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <AnimatedPressable
          onPress={handleNext}
          scaleDown={0.95}
          haptic="medium"
          style={styles.ctaButton}
        >
          <Animated.Text style={styles.ctaText}>
            {isLast ? 'EMPEZAR' : 'SIGUIENTE'}
          </Animated.Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconWrap: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 46,
    marginBottom: spacing.lg,
  },
  description: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    borderCurve: 'continuous',
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.primaryContainer,
  },
  dotInactive: {
    width: 12,
    backgroundColor: colors.surfaceContainerHighest,
  },
  ctaButton: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 16,
    color: colors.onPrimary,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
