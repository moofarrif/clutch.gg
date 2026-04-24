import { ELO } from '../constants/elo';

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateElo(
  playerMmr: number,
  opponentAvgMmr: number,
  won: boolean,
  matchesPlayed: number
): number {
  const k = matchesPlayed < ELO.VETERAN_THRESHOLD ? ELO.K_FACTOR_NEW : ELO.K_FACTOR_VETERAN;
  const expected = expectedScore(playerMmr, opponentAvgMmr);
  const actual = won ? 1 : 0;
  return Math.round(playerMmr + k * (actual - expected));
}

export function generateInitialMmr(): number {
  const variance = ELO.INITIAL_MMR * ELO.MMR_VARIANCE;
  return Math.round(ELO.INITIAL_MMR + (Math.random() * 2 - 1) * variance);
}
