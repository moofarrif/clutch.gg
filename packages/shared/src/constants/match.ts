export const MATCH = {
  MAX_PLAYERS: 10,
  TEAM_SIZE: 5,
  VOTE_THRESHOLD: 0.6,
  STATUSES: ['open', 'full', 'drafting', 'playing', 'voting', 'completed', 'cancelled'] as const,
} as const;

export type MatchStatus = (typeof MATCH.STATUSES)[number];
