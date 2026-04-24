export const RANKS = {
  BRONZE: { name: 'bronze', label: 'Bronze', minMmr: 0, color: '#cd7f32' },
  SILVER: { name: 'silver', label: 'Silver', minMmr: 1100, color: '#c0c0c0' },
  GOLD: { name: 'gold', label: 'Gold', minMmr: 1300, color: '#efc900' },
  PLATINUM: { name: 'platinum', label: 'Platinum', minMmr: 1500, color: '#beee00' },
  DIAMOND: { name: 'diamond', label: 'Diamond', minMmr: 1700, color: '#00f4fe' },
} as const;

export type RankName = (typeof RANKS)[keyof typeof RANKS]['name'];

export function getRankForMmr(mmr: number) {
  if (mmr >= RANKS.DIAMOND.minMmr) return RANKS.DIAMOND;
  if (mmr >= RANKS.PLATINUM.minMmr) return RANKS.PLATINUM;
  if (mmr >= RANKS.GOLD.minMmr) return RANKS.GOLD;
  if (mmr >= RANKS.SILVER.minMmr) return RANKS.SILVER;
  return RANKS.BRONZE;
}
