import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchDetail, useVoteResult } from '../../../hooks/useMatches';
import { AnimatedPressable, StaggeredItem, SuccessCheck } from '../../../components/animated';
import { Icon } from '../../../components/atoms';
import { useState } from 'react';
import { getErrorMessage } from '../../../utils/api-error';
import { getRankForMmr } from '@clutch/shared';
import { colors, spacing, radii, shadow, buttonStyles, withOpacity } from '../../../theme';

export default function VoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { data: match, isLoading } = useMatchDetail(id as string);
  const voteResult = useVoteResult();
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const players = match?.players ?? [];
  const teamAPlayers = match?.players.filter(p => p.team === 'A') ?? [];
  const teamBPlayers = match?.players.filter(p => p.team === 'B') ?? [];

  const teamAMmr = teamAPlayers.length > 0
    ? Math.round(teamAPlayers.reduce((sum, p) => sum + p.user.mmr, 0) / teamAPlayers.length)
    : 0;
  const teamBMmr = teamBPlayers.length > 0
    ? Math.round(teamBPlayers.reduce((sum, p) => sum + p.user.mmr, 0) / teamBPlayers.length)
    : 0;

  const teamARank = getRankForMmr(teamAMmr);
  const teamBRank = getRankForMmr(teamBMmr);

  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const toggleAttendance = (playerId: string) => {
    setAttendance((prev) => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const winnerName =
    scoreA && scoreB
      ? Number(scoreA) > Number(scoreB)
        ? 'EQUIPO A'
        : Number(scoreB) > Number(scoreA)
          ? 'EQUIPO B'
          : 'EMPATE'
      : null;

  const presentCount = Object.values(attendance).filter(Boolean).length;

  const rankBorderColor = (mmr: number) => {
    const rank = getRankForMmr(mmr);
    return rank.color;
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primaryContainer} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Top App Bar */}
      <View
        style={[
          styles.appBar,
          { height: 64 + insets.top, paddingTop: insets.top },
        ]}
        accessibilityRole="header"
      >
        <AnimatedPressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <Icon name="back" size={22} color={colors.primaryContainer} />
          <Text style={styles.appBarTitle}>RESULTADOS DEL PARTIDO</Text>
        </AnimatedPressable>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel="Ayuda">
          <Icon name="info-circle" size={20} color={colors.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Section */}
        <View style={styles.scoreSection}>
          {/* Team A */}
          <View style={styles.teamColumn} accessibilityLabel={`Equipo A, MMR promedio ${teamAMmr}`}>
            <View style={styles.teamBadgeWrap}>
              <View style={[styles.teamCrest, { borderTopColor: teamARank.color }]}>
                <Icon name="soccer" size={40} color={colors.onSurface} />
              </View>
              <View style={styles.localTag}>
                <Text style={styles.localTagText}>EQUIPO A</Text>
              </View>
            </View>
            <Text style={styles.teamName}>EQUIPO A</Text>
            <Text style={styles.teamRank}>MMR: {teamAMmr}</Text>
            <TextInput
              value={scoreA}
              onChangeText={setScoreA}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="0"
              placeholderTextColor={colors.outlineVariant}
              style={styles.scoreInput}
              accessibilityLabel="Goles equipo local"
            />
          </View>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          {/* Team B */}
          <View style={styles.teamColumn} accessibilityLabel={`Equipo B, MMR promedio ${teamBMmr}`}>
            <View style={styles.teamBadgeWrap}>
              <View style={[styles.teamCrest, { borderTopColor: teamBRank.color }]}>
                <Icon name="soccer" size={40} color={colors.onSurface} />
              </View>
              <View style={styles.visitorTag}>
                <Text style={styles.visitorTagText}>EQUIPO B</Text>
              </View>
            </View>
            <Text style={styles.teamName}>EQUIPO B</Text>
            <Text style={styles.teamRank}>MMR: {teamBMmr}</Text>
            <TextInput
              value={scoreB}
              onChangeText={setScoreB}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="0"
              placeholderTextColor={colors.outlineVariant}
              style={styles.scoreInput}
              accessibilityLabel="Goles equipo visitante"
            />
          </View>
        </View>

        {/* Outcome Bar */}
        {winnerName && (
          <View style={styles.outcomeBar} accessibilityLabel={`Resultado: ${winnerName}`}>
            <View>
              <Text style={styles.outcomeLabel}>SELECCION ACTUAL</Text>
              <Text style={styles.outcomeValue}>{winnerName}</Text>
            </View>
          </View>
        )}

        {/* Attendance Section */}
        <View style={styles.attendanceSection}>
          <View style={styles.attendanceHeader}>
            <Text style={styles.attendanceTitle} accessibilityRole="header">
              ASISTENCIA DE JUGADORES
            </Text>
            <Text style={styles.attendanceCount}>
              {presentCount}/{players.length} PRESENTES
            </Text>
          </View>

          <View style={styles.attendanceList}>
            {players.map((p, index) => {
              const isPresent = attendance[p.userId];
              return (
                <StaggeredItem key={p.userId} index={index}>
                  <View
                    style={[styles.attendanceCard, !isPresent && styles.attendanceCardAbsent]}
                    accessibilityLabel={`${p.user.name}, ${`MMR ${p.user.mmr}`}, ${isPresent ? 'presente' : 'ausente'}`}
                  >
                    <View style={styles.attendanceLeft}>
                      {/* Avatar */}
                      <View
                        style={[
                          styles.attendanceAvatar,
                          { borderColor: rankBorderColor(p.user.mmr) },
                        ]}
                      >
                        <Text style={styles.attendanceAvatarText}>
                          {p.user.name.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.attendanceName}>{p.user.name}</Text>
                        <Text style={styles.attendanceRank}>{`MMR ${p.user.mmr}`}</Text>
                      </View>
                    </View>

                    <AnimatedPressable
                      onPress={() => toggleAttendance(p.userId)}
                      style={[
                        styles.attendanceToggle,
                        isPresent ? styles.attendanceTogglePresent : styles.attendanceToggleAbsent,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Marcar ${p.user.name} como ${isPresent ? 'ausente' : 'presente'}`}
                    >
                      <Text
                        style={[
                          styles.attendanceToggleText,
                          { color: isPresent ? colors.onPrimaryFixed : colors.onSurfaceVariant },
                        ]}
                      >
                        {isPresent ? 'PRESENTE' : 'AUSENTE'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </StaggeredItem>
              );
            })}
          </View>
        </View>

        {/* Submit CTA */}
        <AnimatedPressable
          onPress={() => {
            const winner = Number(scoreA) > Number(scoreB) ? 'team_a' : 'team_b';
            voteResult.mutate({
              matchId: id as string,
              vote: winner,
              scoreA: Number(scoreA),
              scoreB: Number(scoreB),
            }, {
              onSuccess: () => setShowSuccess(true),
              onError: async (error: unknown) => {
                const msg = await getErrorMessage(error);
                Alert.alert('Error', msg);
              },
            });
          }}
          disabled={!scoreA || !scoreB || voteResult.isPending}
          style={[
            buttonStyles.primary,
            shadow('ctaLime'),
            (!scoreA || !scoreB) ? buttonStyles.disabled : {},
          ]}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel="Enviar resultado"
          accessibilityState={{ disabled: !scoreA || !scoreB }}
        >
          {voteResult.isPending ? (
            <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
          ) : (
            <Text style={buttonStyles.primaryText}>ENVIAR RESULTADO</Text>
          )}
        </AnimatedPressable>

        {/* Warning */}
        <Text style={styles.warningText} accessibilityRole="text">
          EL ENVIO ES DEFINITIVO. AMBOS CAPITANES DEBEN CONFIRMAR.
        </Text>
      </ScrollView>
      <SuccessCheck visible={showSuccess} message="¡Voto enviado!" onDone={() => { setShowSuccess(false); router.push(`/match/${id}/rate`); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },

  /* App Bar */
  appBar: {
    backgroundColor: withOpacity(colors.background, 0.7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backArrow: {
    color: colors.primaryContainer,
    fontSize: 22,
    fontWeight: '700',
  },
  appBarTitle: {
    color: colors.primaryContainer,
    fontSize: 14,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  helpIcon: {
    fontSize: 20,
  },

  /* Score Section */
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  teamColumn: {
    alignItems: 'center',
    flex: 1,
  },
  teamBadgeWrap: {
    position: 'relative',
  },
  teamCrest: {
    width: 96,
    height: 96,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceContainerHighest,
    borderTopWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCrestEmoji: {
    fontSize: 40,
  },
  localTag: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  localTagText: {
    color: colors.onSecondary,
    fontSize: 10,
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  visitorTag: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  visitorTagText: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  teamName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 20,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -1,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  teamRank: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    color: colors.secondaryDim,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: spacing.xs,
  },
  scoreInput: {
    width: 80,
    backgroundColor: colors.surfaceContainerHighest,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 40,
    color: colors.primaryContainer,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    marginTop: spacing.md,
  },

  /* VS Divider */
  vsDivider: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  vsLine: {
    width: 32,
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.3,
  },
  vsText: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 24,
    fontStyle: 'italic',
    lineHeight: 30,
    color: colors.outlineVariant,
    opacity: 0.5,
  },

  /* Outcome Bar */
  outcomeBar: {
    backgroundColor: colors.surfaceContainer,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryContainer,
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outcomeLabel: {
    fontFamily: 'Lexend_700Bold',
    fontWeight: '700',
    fontSize: 10,
    color: colors.primaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  outcomeValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },

  /* Attendance */
  attendanceSection: {
    marginTop: spacing['2xl'],
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  attendanceTitle: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  attendanceCount: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  attendanceList: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  attendanceCard: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceCardAbsent: {
    opacity: 0.5,
  },
  attendanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  attendanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 2,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceAvatarText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '700',
  },
  attendanceName: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: colors.onSurface,
  },
  attendanceRank: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  attendanceToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  attendanceTogglePresent: {
    backgroundColor: colors.primaryContainer,
  },
  attendanceToggleAbsent: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  attendanceToggleText: {
    fontFamily: 'Lexend_900Black',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  /* Submit */
  submitButton: {
    marginTop: spacing['2xl'],
    paddingVertical: spacing.xl,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: 'SpaceGrotesk_900Black',
    fontWeight: '900',
    fontSize: 18,
    color: colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 3.2,
  },

  /* Warning */
  warningText: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 9,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
