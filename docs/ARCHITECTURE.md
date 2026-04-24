# Clutch.gg — Diagramas de Arquitectura

## 1. Arquitectura Completa

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                    CLUTCH.GG — ARQUITECTURA COMPLETA                            ║
╚══════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES                                          │
│                                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                     │
│   │   iOS App     │    │ Android App  │    │   Web App    │                     │
│   │  (Expo Go)    │    │  (Expo Go)   │    │ (localhost)  │                     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                     │
│          └───────────────────┼───────────────────┘                              │
│                              │                                                  │
│              ┌───────────────┴───────────────┐                                  │
│              │     apps/mobile/ (Expo)        │                                  │
│              │                                │                                  │
│              │  ┌──────────┐ ┌─────────────┐ │                                  │
│              │  │ Expo     │ │ React       │ │                                  │
│              │  │ Router   │ │ Native      │ │                                  │
│              │  │ (11      │ │ + Reanimated│ │                                  │
│              │  │ screens) │ │ + Haptics   │ │                                  │
│              │  └──────────┘ └─────────────┘ │                                  │
│              │                                │                                  │
│              │  ┌──────────┐ ┌─────────────┐ │                                  │
│              │  │ TanStack │ │ Zustand     │ │                                  │
│              │  │ Query v5 │ │ (auth store)│ │                                  │
│              │  │ (cache)  │ │ +SecureStore│ │                                  │
│              │  └────┬─────┘ └─────────────┘ │                                  │
│              │       │                        │                                  │
│              │  ┌────┴─────┐ ┌─────────────┐ │                                  │
│              │  │ ky       │ │ socket.io   │ │                                  │
│              │  │ (HTTP)   │ │ (WebSocket) │ │                                  │
│              │  └────┬─────┘ └──────┬──────┘ │                                  │
│              └───────┼──────────────┼────────┘                                  │
│                      │              │                                            │
└──────────────────────┼──────────────┼────────────────────────────────────────────┘
                       │              │
            HTTP/REST  │              │  WebSocket
            (JWT Auth) │              │  (JWT Handshake)
                       │              │
┌──────────────────────┼──────────────┼────────────────────────────────────────────┐
│                      ▼              ▼                                            │
│              ┌──────────────────────────────┐                                   │
│              │     apps/api/ (NestJS)        │                                   │
│              │         :3000                 │                                   │
│              │                               │                                   │
│              │  ┌─────────────────────────┐  │                                   │
│              │  │      main.ts            │  │                                   │
│              │  │  Pino Logger + CORS     │  │                                   │
│              │  │  Swagger (/api/docs)    │  │                                   │
│              │  │  Global JWT Guard       │  │                                   │
│              │  │  Rate Limiter           │  │                                   │
│              │  └────────────┬────────────┘  │                                   │
│              │               │               │                                   │
│   ┌──────────┼───────────────┼───────────────┼──────────────┐                   │
│   │          │       MÓDULOS NestJS          │              │                   │
│   │  ┌───────┴──────┐ ┌─────┴──────┐ ┌──────┴───────┐     │                   │
│   │  │    auth/      │ │  users/     │ │  matches/    │     │                   │
│   │  │ • register    │ │ • CRUD      │ │ • CRUD       │     │                   │
│   │  │ • login       │ │ • profile   │ │ • join/leave │     │                   │
│   │  │ • google      │ │ • repository│ │ • geo query  │     │                   │
│   │  │ • refresh     │ │   layer     │ │ • PostGIS    │     │                   │
│   │  │ • JWT pair    │ │             │ │              │     │                   │
│   │  └───────────────┘ └────────────┘ └──────────────┘     │                   │
│   │                                                         │                   │
│   │  ┌───────────────┐ ┌────────────┐ ┌──────────────┐     │                   │
│   │  │ matchmaking/  │ │  voting/   │ │    elo/      │     │                   │
│   │  │ • BullMQ      │ │ • vote     │ │ • BullMQ     │     │                   │
│   │  │ • serpentine  │ │ • threshold│ │ • calculate  │     │                   │
│   │  │   draft       │ │ • events → │─┤ • elo_history│     │                   │
│   │  │ • balance MMR │ │   bus      │ │ • update MMR │     │                   │
│   │  └───────────────┘ └────────────┘ └──────────────┘     │                   │
│   │                                                         │                   │
│   │  ┌───────────────┐ ┌────────────┐ ┌──────────────┐     │                   │
│   │  │  conduct/     │ │ gateway/   │ │notifications/│     │                   │
│   │  │ • rate 1-5★   │ │ • Socket.io│ │ • BullMQ     │     │                   │
│   │  │ • avg score   │ │ • rooms    │ │ • Expo Push   │     │                   │
│   │  │              │ │ • broadcast│ │ • batch       │     │                   │
│   │  └───────────────┘ └────────────┘ └──────────────┘     │                   │
│   │                                                         │                   │
│   │  ┌───────────────┐ ┌────────────┐ ┌──────────────┐     │                   │
│   │  │ config-params/│ │  health/   │ │  event-bus/  │     │                   │
│   │  │ • key/value   │ │ • DB ping  │ │ • EventEmitter│     │                   │
│   │  │ • cache 60s   │ │ • Redis    │ │ • decouple   │     │                   │
│   │  │ • seed defaults│ │   ping    │ │   modules    │     │                   │
│   │  └───────────────┘ └────────────┘ └──────────────┘     │                   │
│   └─────────────────────────────────────────────────────────┘                   │
│              │               │                                                   │
│              │  Drizzle ORM  │    ioredis                                        │
│              │               │                                                   │
└──────────────┼───────────────┼───────────────────────────────────────────────────┘
               │               │
┌──────────────┼───────────────┼───────────────────────────────────────────────────┐
│              ▼               ▼               INFRAESTRUCTURA (Docker Compose)    │
│                                                                                  │
│  ┌─────────────────────┐  ┌──────────────┐                                      │
│  │  PostgreSQL 16       │  │  Redis 7     │                                      │
│  │  + PostGIS           │  │  :6380       │                                      │
│  │  :5432               │  │              │                                      │
│  │                      │  │ ┌──────────┐ │                                      │
│  │  ┌────────────────┐  │  │ │Sessions  │ │                                      │
│  │  │ users          │  │  │ │(refresh  │ │                                      │
│  │  │ matches        │  │  │ │ tokens)  │ │                                      │
│  │  │ match_players  │  │  │ ├──────────┤ │                                      │
│  │  │ match_votes    │  │  │ │BullMQ    │ │                                      │
│  │  │ conduct_ratings│  │  │ │(job      │ │                                      │
│  │  │ elo_history    │  │  │ │ queues)  │ │                                      │
│  │  │ config         │  │  │ ├──────────┤ │                                      │
│  │  │ 10 indexes     │  │  │ │Cache     │ │                                      │
│  │  └────────────────┘  │  │ │(config)  │ │                                      │
│  └─────────────────────┘  │ └──────────┘ │                                      │
│                            └──────────────┘                                      │
│  ┌─────────────────────┐                                                         │
│  │  pgAdmin 4  :5050    │                                                         │
│  └─────────────────────┘                                                         │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                         SHARED PACKAGE                                          │
│                     packages/shared/src/                                        │
│                                                                                  │
│   schemas/          types/           constants/        utils/                    │
│   ├─ auth.ts        ├─ socket.ts     ├─ elo.ts         └─ elo.ts               │
│   ├─ user.ts        └─ index.ts      ├─ ranks.ts          calculateElo()       │
│   └─ match.ts                        └─ match.ts          generateInitialMmr() │
│                                                                                  │
│   Consumido por:  apps/mobile (validación forms)                                │
│                   apps/api (DTOs + business logic)                              │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo de Datos E2E

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║              Register → Crear Partido → Draft → Votar → ELO                    ║
╚══════════════════════════════════════════════════════════════════════════════════╝


  FLUJO 1: REGISTRO
  ═════════════════

  📱 Mobile                    🖥️ API                      🗄️ DB/Redis

  [Sign-in Screen]
       │
       │  POST /api/auth/register
       │  { email, password, name }
       │─────────────────────────►│
       │                          │  Zod validates (RegisterSchema)
       │                          │  bcrypt.hash(password, 12)
       │                          │  generateInitialMmr() → 800-1200
       │                          │──────────────────────────►│ INSERT users
       │                          │◄──────────────────────────│ RETURNING *
       │                          │  JWT sign(access, 15m)
       │                          │  JWT sign(refresh, 7d)
       │                          │──────────────────────────►│ SET refresh:{jti}
       │                          │                           │ EX 604800 (Redis)
       │  { user, accessToken,    │◄──────────────────────────│
       │    refreshToken }        │
       │◄─────────────────────────│
       │
       │  saveTokens(SecureStore)
       │  setAuth(zustand)
       │  router.replace('/(tabs)/explore')
       ▼


  FLUJO 2: CREAR PARTIDO
  ══════════════════════

  📱 Mobile                    🖥️ API                      🗄️ DB

  [Create Match Screen]
       │
       │  POST /api/matches
       │  Authorization: Bearer {JWT}
       │  { dateTime, courtName, courtLat, courtLng }
       │─────────────────────────►│
       │                          │  JwtAuthGuard → verify JWT
       │                          │  Zod validates (CreateMatchSchema)
       │                          │──────────────────────────►│ INSERT matches
       │                          │                           │ INSERT match_players
       │                          │                           │ (creator = player 1)
       │  { match }               │◄──────────────────────────│
       │◄─────────────────────────│
       │  invalidateQueries(['matches'])
       ▼


  FLUJO 3: UNIRSE A PARTIDO
  ═════════════════════════

  📱 Mobile                  🖥️ API                  🗄️ DB      📡 Socket    📋 BullMQ

  [Match Lobby]
       │
       │  useMatchSocket(matchId) ──────────────────────────────►│ join room
       │
       │  POST /api/matches/:id/join
       │─────────────────────►│
       │                      │  BEGIN TRANSACTION
       │                      │──────────────────►│ SELECT FOR UPDATE
       │                      │◄──────────────────│ (row locked)
       │                      │  check count < 10
       │                      │──────────────────►│ INSERT match_players
       │                      │  if count = 10:
       │                      │──────────────────►│ UPDATE status='full'
       │                      │  COMMIT
       │  { count, isFull }   │◄──────────────────│
       │◄─────────────────────│
       │                      │───────────────────────────────►│ emit playerJoined
       │  onPlayerJoined ◄─────────────────────────────────────│
       │                      │  if isFull:
       │                      │──────────────────────────────────────────►│ add draft job
       ▼


  FLUJO 4: MATCHMAKING (DRAFT)
  ═══════════════════════════

                             🖥️ BullMQ Worker       🗄️ DB      📡 Socket

                             │  @Processor('matchmaking')
                             │──────────────────────►│ SELECT players + MMR
                             │◄──────────────────────│
                             │
                             │  Sort by MMR desc → Serpentine Draft:
                             │  A: [1742, 1490, 1420, 1200, 1150] avg=1400
                             │  B: [1650, 1580, 1350, 1280, 1100] avg=1392
                             │  Diff: 8.4 MMR ✓
                             │
                             │──────────────────────►│ UPDATE match_players SET team
                             │──────────────────────►│ UPDATE matches status='playing'
                             │◄──────────────────────│
                             │─────────────────────────────────►│ emit draftComplete

  📱 All 10 players
       │  onDraftComplete ◄─────────────────────────────────────│
       │  ════════════════════════════════
       │  ║     JUGAR — OFF APP          ║
       │  ════════════════════════════════
       ▼


  FLUJO 5: VOTACIÓN
  ═════════════════

  📱 Mobile                  🖥️ API                  🗄️ DB      📋 EventBus

  [Vote Screen]
       │  POST /api/matches/:id/vote
       │  { vote: 'team_a' }
       │─────────────────────►│
       │                      │  BEGIN TRANSACTION
       │                      │──────────────────►│ SELECT FOR UPDATE
       │                      │──────────────────►│ UPSERT match_votes
       │                      │──────────────────►│ SELECT count(*)
       │                      │◄──────────────────│ count = 6
       │                      │  threshold = ceil(10 * 0.6) = 6
       │                      │  6 >= 6 → REACHED!
       │                      │  Winner: team_a (5 vs 1)
       │                      │──────────────────►│ UPDATE result='team_a'
       │                      │  COMMIT
       │  { resolved, winner } │◄──────────────────│
       │◄─────────────────────│
       │                      │───────────────────────────────►│ emit match.result
       │                      │                                │  .confirmed
       │                      │                                │ → EloListener
       │                      │                                │ → queue elo job
       ▼


  FLUJO 6: CÁLCULO ELO
  ════════════════════

                             🖥️ BullMQ Worker       🗄️ DB      📡 Socket

                             │  @Processor('elo')
                             │──────────────────────►│ SELECT players + MMR
                             │◄──────────────────────│
                             │
                             │  For each player:
                             │    calculateElo(mmr, oppAvg, won, matches)
                             │    K = matches < 20 ? 32 : 16
                             │    expected = 1/(1+10^((opp-my)/400))
                             │    newMmr = mmr + K*(won-expected)
                             │
                             │──────────────────────►│ UPDATE users SET mmr, wins/losses
                             │──────────────────────►│ INSERT elo_history (x10)
                             │──────────────────────►│ UPDATE matches status='completed'
                             │◄──────────────────────│
                             │─────────────────────────────────►│ emit matchResult

  📱 All 10 players
       │  onMatchResult ◄───────────────────────────────────────│
       │  Navigate to Rate Screen → show ELO animation
       ▼


  FLUJO 7: CALIFICACIÓN CONDUCTA
  ══════════════════════════════

  📱 Mobile                  🖥️ API                  🗄️ DB

  [Rate Screen]
       │  POST /api/matches/:id/rate
       │  { ratings: [{userId, score}...] }
       │─────────────────────►│
       │                      │  Validate: completed, teammate only
       │                      │  BEGIN TRANSACTION
       │                      │──────────────────►│ INSERT conduct_ratings (batch)
       │                      │  Per unique rated user:
       │                      │──────────────────►│ SELECT avg(score)
       │                      │──────────────────►│ UPDATE users conduct_score
       │                      │  COMMIT
       │  { success }          │◄──────────────────│
       │◄─────────────────────│
       │  Navigate to profile → show updated MMR + conduct
       ▼
```
