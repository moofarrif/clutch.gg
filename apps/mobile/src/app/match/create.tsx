import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon } from '../../components/atoms';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../theme';
import { useState, useRef } from 'react';
import { AnimatedPressable, SkeletonLoader } from '../../components/animated';
import { useCreateMatch } from '../../hooks/useMatches';
import { config } from '../../config';
import { useLocation } from '../../hooks/useLocation';
import { useCourtsNearby, useCourts } from '../../hooks/useCourts';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image as ExpoImage } from 'expo-image';
import { getErrorMessage } from '../../utils/api-error';

interface SelectedCourt {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export default function CreateMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedCourt, setSelectedCourt] = useState<SelectedCourt | null>(null);
  const [matchDate, setMatchDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const scrollRef = useRef<ScrollView>(null);

  const COURT_CARD_WIDTH = screenWidth * 0.7;

  // Location + courts (nearby if GPS, all if not)
  const { location } = useLocation();
  const hasLocation = location && location.lat !== 0;
  const { data: nearbyCourts, isLoading: nearbyLoading } = useCourtsNearby(
    location?.lat ?? 0, location?.lng ?? 0, config.nearbyRadiusM,
  );
  const { data: allCourts, isLoading: allCourtsLoading } = useCourts();
  // Show nearby if available, otherwise fallback to all
  const hasNearbyCourts = nearbyCourts && nearbyCourts.length > 0;
  const courts = hasNearbyCourts ? nearbyCourts : allCourts;
  const courtsLoading = hasNearbyCourts ? false : allCourtsLoading;

  const createMatch = useCreateMatch();

  const handlePublish = () => {
    if (!selectedCourt) return;
    createMatch.mutate({
      dateTime: matchDate.toISOString(),
      courtName: selectedCourt.name,
      courtLat: selectedCourt.lat,
      courtLng: selectedCourt.lng,
    }, {
      onSuccess: () => {
        router.replace('/(tabs)/explore');
      },
      onError: async (error: unknown) => {
        const msg = await getErrorMessage(error);
        Alert.alert('Error', msg);
      },
    });
  };

  const onDateChange = (_event: DateTimePickerEvent, d?: Date) => {
    if (d) {
      const updated = new Date(matchDate);
      updated.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
      // Si la fecha+hora resultante es antes del mínimo, ajustar hora
      const min = new Date();
      min.setHours(min.getHours() + MIN_HOURS_AHEAD);
      if (updated < min) {
        updated.setHours(min.getHours() + 1, 0, 0, 0);
      }
      setMatchDate(updated);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, t?: Date) => {
    if (t) {
      const updated = new Date(matchDate);
      updated.setHours(t.getHours(), t.getMinutes());
      setMatchDate(updated);
    }
  };

  const displayDate = matchDate.toLocaleDateString('es', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).toUpperCase();

  const hours = matchDate.getHours();
  const minutes = matchDate.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayTime = `${hours % 12 || 12}:${minutes} ${ampm}`;

  const MIN_HOURS_AHEAD = config.minHoursAhead;
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + MIN_HOURS_AHEAD);
  const isTooSoon = matchDate < minDate;
  const isFormValid = selectedCourt !== null && !isTooSoon;

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 120,
          gap: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.lg }}>
          <AnimatedPressable onPress={() => router.back()} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Icon name="close" size={14} color={colors.onSurface} />
          </AnimatedPressable>
        </View>

        {/* Title */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            Programa Tu{' '}
            <Text style={styles.pageTitleAccent}>Partido</Text>
          </Text>
          <Text style={styles.pageSubtitle}>
            Selecciona cancha y horario. El matchmaking emparejará jugadores de nivel similar.
          </Text>
        </View>

        {/* Step 1 — Cancha (carrusel horizontal) */}
        <View style={styles.sectionGap}>
          <Text style={[styles.sectionTitleCyan, { paddingHorizontal: spacing.lg }]} accessibilityRole="header">
            01. Selecciona Cancha
          </Text>

          {courtsLoading ? (
            <View style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', gap: 12 }}>
              <SkeletonLoader width={COURT_CARD_WIDTH} height={200} borderRadius={radii.lg} />
              <SkeletonLoader width={COURT_CARD_WIDTH * 0.4} height={200} borderRadius={radii.lg} />
            </View>
          ) : courts && courts.length > 0 ? (
            <FlatList
              data={courts as any[]}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedCourt?.id === item.id;
                const distanceKm = item.distance
                  ? `${(item.distance / 1000).toFixed(1)} km`
                  : null;
                return (
                  <AnimatedPressable
                    onPress={() => setSelectedCourt({
                      id: item.id, name: item.name,
                      lat: item.lat, lng: item.lng,
                    })}
                    haptic="light"
                    style={[
                      styles.courtCard,
                      { width: COURT_CARD_WIDTH },
                      isSelected ? styles.courtCardSelected : undefined,
                    ]}
                  >
                    {/* Photo area */}
                    <View style={styles.courtPhoto}>
                      {item.photoUrl ? (
                        <ExpoImage
                          source={{ uri: item.photoUrl }}
                          style={styles.courtPhotoImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <Icon name="soccer" size={40} color={colors.onSurface} style={{ opacity: 0.12 }} />
                      )}
                      {item.verified && (
                        <View style={styles.courtVerifiedBadge}>
                          <Text style={styles.courtVerifiedText}><Icon name="check" size={9} color={colors.secondary} /> Verificada</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={styles.courtSelectedCheck}>
                          <Icon name="check" size={14} color={colors.onPrimaryContainer} />
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={styles.courtInfo}>
                      <Text style={[
                        styles.courtName,
                        isSelected && { color: colors.primaryContainer },
                      ]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.courtAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                      <View style={styles.courtMeta}>
                        <Text style={styles.courtSurface}>
                          {item.surface.toUpperCase()}
                        </Text>
                        {distanceKm && (
                          <Text style={styles.courtDistance}>{distanceKm}</Text>
                        )}
                        <Text style={styles.courtCity}>{item.city}</Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              }}
            />
          ) : (
            <View style={{ paddingHorizontal: spacing.lg, alignItems: 'center', paddingVertical: spacing['2xl'] }}>
              <Text style={styles.courtEmptyText}>No hay canchas disponibles cerca</Text>
            </View>
          )}
        </View>

        {/* Step 2 — Fecha y Hora */}
        <View style={[styles.sectionGap, { paddingHorizontal: spacing.lg }]}>
          <Text style={styles.sectionTitleCyan} accessibilityRole="header">02. Fecha y Hora</Text>

          {/* Date/Time pickers — native on mobile, fallback on web */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeSlot}>
              <Text style={styles.dateTimeLabel}>Fecha del partido</Text>
              {Platform.OS === 'web' ? (
                <AnimatedPressable
                  onPress={() => {
                    // Web fallback: use native input type="date"
                    const input = document.createElement('input');
                    input.type = 'date';
                    input.min = new Date().toISOString().split('T')[0];
                    input.value = matchDate.toISOString().split('T')[0];
                    input.onchange = (e: any) => {
                      const d = new Date(e.target.value + 'T' + matchDate.toTimeString().slice(0, 5));
                      if (!isNaN(d.getTime())) setMatchDate(d);
                    };
                    input.click();
                  }}
                  style={styles.webPickerButton}
                  haptic="light"
                >
                  <Icon name="calendar" size={16} color={colors.primaryContainer} />
                  <Text style={styles.webPickerText}>{displayDate}</Text>
                </AnimatedPressable>
              ) : (
                <DateTimePicker
                  value={matchDate}
                  mode="date"
                  display="compact"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  locale="es"
                  themeVariant="dark"
                  accentColor={colors.primaryContainer}
                  style={styles.pickerCompact}
                />
              )}
            </View>

            <View style={styles.dateTimeDivider} />

            <View style={styles.dateTimeSlot}>
              <Text style={styles.dateTimeLabel}>Hora de inicio</Text>
              {Platform.OS === 'web' ? (
                <AnimatedPressable
                  onPress={() => {
                    const input = document.createElement('input');
                    input.type = 'time';
                    input.step = '300'; // 5 min intervals
                    input.value = matchDate.toTimeString().slice(0, 5);
                    input.onchange = (e: any) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const d = new Date(matchDate);
                      d.setHours(h, m);
                      setMatchDate(d);
                    };
                    input.click();
                  }}
                  style={styles.webPickerButton}
                  haptic="light"
                >
                  <Icon name="time" size={16} color={colors.primaryContainer} />
                  <Text style={styles.webPickerText}>{displayTime}</Text>
                </AnimatedPressable>
              ) : (
                <DateTimePicker
                  value={matchDate}
                  mode="time"
                  display="compact"
                  minuteInterval={5}
                  onChange={onTimeChange}
                  locale="en_US"
                  themeVariant="dark"
                  is24Hour={false}
                  accentColor={colors.primaryContainer}
                  style={styles.pickerCompact}
                />
              )}
            </View>
          </View>

          {/* Minimum time hint */}
          <Text style={styles.dateTimeHint}>
            Mínimo {MIN_HOURS_AHEAD} horas de anticipación
          </Text>
        </View>

        {/* Warning */}
        {isTooSoon && selectedCourt && (
          <View style={[styles.warningCard, { marginHorizontal: spacing.lg }]}>
            <Icon name="warning" size={18} color={colors.error} />
            <Text style={styles.warningText}>
              El partido debe programarse con al menos {MIN_HOURS_AHEAD} horas de anticipación
            </Text>
          </View>
        )}

        {/* Info card */}
        <View style={[styles.infoCard, { marginHorizontal: spacing.lg }]}>
          <Icon name="bolt" size={16} color={colors.secondary} />
          <Text style={styles.infoDesc}>
            Matchmaking automático por MMR para equipos equilibrados
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <AnimatedPressable
          onPress={handlePublish}
          style={[buttonStyles.primary, !isFormValid ? buttonStyles.disabled : undefined]}
          disabled={createMatch.isPending || !isFormValid}
          accessibilityRole="button"
          accessibilityLabel="Publicar partido"
          accessibilityState={{ disabled: createMatch.isPending || !isFormValid }}
        >
          {createMatch.isPending ? (
            <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
          ) : (
            <Text style={[buttonStyles.primaryText, !isFormValid && buttonStyles.disabledText]}>
              Publicar Partido
            </Text>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },

  closeButton: {
    width: 32, height: 32, borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1, borderColor: colors.outlineVariant,
    justifyContent: 'center', alignItems: 'center',
  },
  closeIcon: { fontSize: 14, color: colors.onSurface },

  // Title
  pageTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, fontWeight: '700',
    fontStyle: 'italic', letterSpacing: -1, lineHeight: 36,
    textTransform: 'uppercase', color: colors.onSurface,
  },
  pageTitleAccent: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, fontWeight: '700',
    fontStyle: 'italic', letterSpacing: -1, lineHeight: 36,
    textTransform: 'uppercase', color: colors.primaryContainer,
  },
  pageSubtitle: {
    fontFamily: 'Lexend_400Regular', fontSize: 12, letterSpacing: 0.5,
    color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 18,
  },
  sectionGap: { gap: spacing.lg },
  sectionTitleCyan: {
    fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, fontWeight: '600',
    color: colors.secondary, textTransform: 'uppercase',
  },

  // Court carousel
  courtCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg, borderCurve: 'continuous',
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  courtCardSelected: {
    borderColor: colors.primaryContainer,
  },
  courtPhoto: {
    height: 110, backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center', alignItems: 'center',
  },
  courtPhotoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  courtPhotoPlaceholder: { fontSize: 40, opacity: 0.12 },
  courtVerifiedBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: withOpacity(colors.secondary, 0.15),
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.full,
  },
  courtVerifiedText: {
    fontFamily: 'Lexend_400Regular', fontSize: 9, color: colors.secondary,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  courtSelectedCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center', alignItems: 'center',
  },
  courtSelectedCheckIcon: {
    fontSize: 14, fontWeight: '900', color: colors.onPrimaryContainer,
  },
  courtInfo: {
    padding: spacing.lg, gap: 6,
  },
  courtName: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16, fontWeight: '700',
    color: colors.onSurface, textTransform: 'uppercase', letterSpacing: -0.3,
  },
  courtAddress: {
    fontFamily: 'Manrope_400Regular', fontSize: 12, color: colors.onSurfaceVariant,
  },
  courtMeta: {
    flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center',
  },
  courtSurface: {
    fontFamily: 'Lexend_400Regular', fontSize: 9, letterSpacing: 2,
    color: colors.secondary, backgroundColor: withOpacity(colors.secondary, 0.1),
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.full,
  },
  courtDistance: {
    fontFamily: 'Lexend_400Regular', fontSize: 9, letterSpacing: 1,
    color: colors.outline,
  },
  courtCity: {
    fontFamily: 'Lexend_400Regular', fontSize: 9, letterSpacing: 1,
    color: colors.outline,
  },
  courtEmptyText: {
    fontFamily: 'Lexend_400Regular', fontSize: 12, color: colors.outline,
    textTransform: 'uppercase', letterSpacing: 2,
  },

  // Date/time
  dateTimeContainer: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg, borderCurve: 'continuous',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dateTimeSlot: {
    flex: 1,
    padding: spacing.lg,
    gap: 12,
  },
  dateTimeDivider: {
    width: 1,
    backgroundColor: withOpacity(colors.outlineVariant, 0.2),
    marginVertical: spacing.md,
  },
  dateTimeLabel: {
    fontFamily: 'Lexend_700Bold', fontSize: 9, fontWeight: '700',
    letterSpacing: 3, textTransform: 'uppercase', color: colors.onSurfaceVariant,
  },
  pickerCompact: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  webPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerHighest,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  webPickerText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  dateTimeHint: {
    fontFamily: 'Lexend_400Regular', fontSize: 11,
    color: colors.outline, letterSpacing: 0.5,
  },
  // Warning
  warningCard: {
    flexDirection: 'row', backgroundColor: withOpacity(colors.error, 0.1),
    borderRadius: radii.lg, borderCurve: 'continuous',
    padding: spacing.lg, gap: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: withOpacity(colors.error, 0.2),
  },
  warningIcon: { fontSize: 18 },
  warningText: {
    fontFamily: 'Manrope_400Regular', fontSize: 13, color: colors.error,
    flex: 1, lineHeight: 18,
  },

  // Info card
  infoCard: {
    flexDirection: 'row', backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg, borderCurve: 'continuous',
    padding: spacing.xl, gap: spacing.lg, alignItems: 'flex-start',
    borderWidth: 1, borderColor: withOpacity(colors.secondary, 0.2),
  },
  infoIcon: { fontSize: 24 },
  infoTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, fontWeight: '700',
    color: colors.secondary, textTransform: 'uppercase',
  },
  infoDesc: {
    fontFamily: 'Manrope_400Regular', fontSize: 13,
    color: colors.onSurfaceVariant, lineHeight: 18,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: withOpacity(colors.surfaceContainer, 0.9),
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: withOpacity(colors.outlineVariant, 0.2),
  },
});
