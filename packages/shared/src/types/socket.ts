export interface ServerToClientEvents {
  matchUpdate: (data: { matchId: string; status: string }) => void;
  playerJoined: (data: { userId: string; matchId: string; count: number }) => void;
  playerLeft: (data: { userId: string; matchId: string; count: number }) => void;
  draftComplete: (data: { matchId: string; teamA: string[]; teamB: string[] }) => void;
  voteUpdate: (data: { matchId: string; votesCount: number }) => void;
  matchResult: (data: { matchId: string; result: string; newMmr: number }) => void;
}

export interface ClientToServerEvents {
  joinMatchRoom: (matchId: string) => void;
  leaveMatchRoom: (matchId: string) => void;
}
