import { api } from './services/api';

/**
 * App configuration.
 *
 * Priority: Remote config (backend DB) → env vars → defaults.
 * Call `config.hydrate()` on app startup to fetch remote values.
 *
 * All distances are in KILOMETERS externally (env vars, UI).
 * Use config.nearbyRadiusKm for display and config.nearbyRadiusM for API calls.
 */

// Defaults from env vars / shared constants
const DEFAULTS = {
  // Match
  nearbyRadiusKm: Number(process.env.EXPO_PUBLIC_NEARBY_RADIUS_KM) || 50,
  minHoursAhead: Number(process.env.EXPO_PUBLIC_MIN_HOURS_AHEAD) || 5,
  maxPlayers: 10,
  teamSize: 5,
  voteThreshold: 0.6,
  // ELO
  initialMmr: 1000,
  kFactorNew: 32,
  kFactorVeteran: 16,
  veteranThreshold: 20,
  // Squad
  maxSquadMembers: 5,
};

// Mutable config state
let _config = { ...DEFAULTS };
let _hydrated = false;

export const config = {
  /** Radius in km for "Cerca de ti" */
  get nearbyRadiusKm() { return _config.nearbyRadiusKm; },

  /** Radius in meters — for API calls */
  get nearbyRadiusM() { return _config.nearbyRadiusKm * 1000; },

  /** Minimum hours ahead to create a match */
  get minHoursAhead() { return _config.minHoursAhead; },

  /** Max players per match */
  get maxPlayers() { return _config.maxPlayers; },

  /** Vote threshold (0-1) to resolve a match */
  get voteThreshold() { return _config.voteThreshold; },

  /** Team size (players per team) */
  get teamSize() { return _config.teamSize; },

  /** Initial MMR for new players */
  get initialMmr() { return _config.initialMmr; },

  /** K-factor for new players (<20 matches) */
  get kFactorNew() { return _config.kFactorNew; },

  /** K-factor for veteran players (>=20 matches) */
  get kFactorVeteran() { return _config.kFactorVeteran; },

  /** Matches threshold to be considered veteran */
  get veteranThreshold() { return _config.veteranThreshold; },

  /** Max members per squad */
  get maxSquadMembers() { return _config.maxSquadMembers; },

  /** Whether remote config has been loaded */
  get isHydrated() { return _hydrated; },

  /** Legal URLs (always from env vars — not stored in DB) */
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://www.google.com',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://www.google.com',
  statusUrl: process.env.EXPO_PUBLIC_STATUS_URL ?? 'https://www.google.com',

  /**
   * Fetch config from backend and merge with defaults.
   * Safe to call on startup — silently falls back to env vars on failure.
   */
  async hydrate(): Promise<void> {
    try {
      const remote = await api.get('config').json<Record<string, unknown>>();
      if (remote && typeof remote === 'object') {
        if (typeof remote.nearby_radius_km === 'number') _config.nearbyRadiusKm = remote.nearby_radius_km;
        if (typeof remote.min_hours_ahead === 'number') _config.minHoursAhead = remote.min_hours_ahead;
        if (typeof remote.max_players === 'number') _config.maxPlayers = remote.max_players;
        if (typeof remote.vote_threshold === 'number') _config.voteThreshold = remote.vote_threshold;
        if (typeof remote.initial_mmr === 'number') _config.initialMmr = remote.initial_mmr;
        if (typeof remote.team_size === 'number') _config.teamSize = remote.team_size;
        if (typeof remote.k_factor_new === 'number') _config.kFactorNew = remote.k_factor_new;
        if (typeof remote.k_factor_veteran === 'number') _config.kFactorVeteran = remote.k_factor_veteran;
        if (typeof remote.veteran_threshold === 'number') _config.veteranThreshold = remote.veteran_threshold;
        if (typeof remote.max_squad_members === 'number') _config.maxSquadMembers = remote.max_squad_members;
      }
      _hydrated = true;
    } catch {
      // Silent fallback to env var defaults
      _hydrated = true;
    }
  },
};
