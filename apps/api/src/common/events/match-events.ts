export class MatchResultConfirmedEvent {
  constructor(
    public readonly matchId: string,
    public readonly result: 'team_a' | 'team_b',
  ) {}
}

export class PlayerJoinedMatchEvent {
  constructor(
    public readonly matchId: string,
    public readonly userId: string,
    public readonly playerCount: number,
  ) {}
}

export class MatchFullEvent {
  constructor(
    public readonly matchId: string,
  ) {}
}
