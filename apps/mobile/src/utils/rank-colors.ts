import { colors } from '../theme';

export function getMmrColor(mmr: number): string {
  if (mmr >= 3000) return colors.secondary;
  if (mmr >= 2000) return colors.primaryContainer;
  if (mmr >= 1500) return colors.tertiaryDim;
  return '#cd7f32';
}

export function getTierColor(tierColor: string): string {
  switch (tierColor) {
    case 'secondary': return colors.secondary;
    case 'tertiaryDim': return colors.tertiaryDim;
    case 'tertiary': return colors.tertiary;
    case 'primaryContainer': return colors.primaryContainer;
    default: return colors.outline;
  }
}

export function getOutcomeLabel(outcome: string): { label: string; color: string; barColor: string } {
  switch (outcome) {
    case 'victory': return { label: 'VICTORIA', color: colors.primaryContainer, barColor: colors.primaryContainer };
    case 'defeat': return { label: 'DERROTA', color: colors.onSurfaceVariant, barColor: colors.error };
    case 'draw': return { label: 'EMPATE', color: colors.onSurfaceVariant, barColor: colors.outline };
    default: return { label: outcome.toUpperCase(), color: colors.onSurface, barColor: colors.outline };
  }
}

export function getActivityColor(activity: string): string {
  switch (activity) {
    case 'EXTREMA': return colors.primaryContainer;
    case 'DIARIO PRO': return colors.secondary;
    case 'INTENSA': return colors.tertiaryDim;
    case 'CASUAL': return colors.outline;
    default: return colors.outline;
  }
}
