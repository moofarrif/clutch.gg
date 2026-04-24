import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { getRankForMmr } from '@clutch/shared';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://clutch:clutch_dev@localhost:5432/clutch';

// Avatar generator — uses ui-avatars.com (free, no auth)
function avatar(name: string, bg: string, color: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&size=200&bold=true&format=png`;
}

// Court photos — Unsplash source (free, permanent URLs)
const COURT_PHOTOS = [
  'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=800&h=400&fit=crop', // futbol sintetica
  'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=400&fit=crop', // cancha verde
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&h=400&fit=crop', // cancha noche
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=400&fit=crop', // futbol indoor
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop', // soccer field
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop', // futbol 5
  'https://images.unsplash.com/photo-1459865264687-595f652ea24c?w=800&h=400&fit=crop', // stadium night
  'https://images.unsplash.com/photo-1556056333-18a1a4f1e32f?w=800&h=400&fit=crop', // turf field
];

async function seed() {
  console.log('🌱 Seeding database...');
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  // ============================================
  // 0. Clean slate — truncate all tables
  // ============================================
  console.log('  → Limpiando tablas...');
  await client`TRUNCATE conduct_ratings, match_votes, elo_history, match_players, matches, squad_members, squads, friendships, courts, config, users CASCADE`;
  console.log('    ✓ Tablas limpias');

  // ============================================
  // 1. Config
  // ============================================
  console.log('  → Config params...');
  await db.insert(schema.config).values([
    { key: 'initial_mmr', value: 1000 },
    { key: 'mmr_variance', value: 0.2 },
    { key: 'vote_threshold', value: 0.6 },
    { key: 'max_players', value: 10 },
    { key: 'min_hours_ahead', value: 5 },
  ]).onConflictDoNothing();

  // ============================================
  // 2. Users (16 jugadores)
  // ============================================
  console.log('  → Users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  const usersData = [
    { email: 'carlos@clutch.gg', name: 'Carlos Mendoza', city: 'Bogotá', mmr: 1742, photo: avatar('CM', '1a2000', 'cafd00') },
    { email: 'sofia@clutch.gg', name: 'Sofía Ramírez', city: 'Bogotá', mmr: 1650, photo: avatar('SR', '00575b', '00f4fe') },
    { email: 'diego@clutch.gg', name: 'Diego Herrera', city: 'Medellín', mmr: 1580, photo: avatar('DH', '5b4b00', 'ffd709') },
    { email: 'valentina@clutch.gg', name: 'Valentina Castro', city: 'Bogotá', mmr: 1490, photo: avatar('VC', '450900', 'ff7351') },
    { email: 'andres@clutch.gg', name: 'Andrés Vargas', city: 'Cali', mmr: 1420, photo: avatar('AV', '1a2000', 'cafd00') },
    { email: 'camila@clutch.gg', name: 'Camila Torres', city: 'Bogotá', mmr: 1350, photo: avatar('CT', '00575b', '00f4fe') },
    { email: 'juan@clutch.gg', name: 'Juan Pablo Ríos', city: 'Bogotá', mmr: 1280, photo: avatar('JP', '5b4b00', 'ffd709') },
    { email: 'laura@clutch.gg', name: 'Laura Gómez', city: 'Medellín', mmr: 1200, photo: avatar('LG', '1a2000', 'cafd00') },
    { email: 'mateo@clutch.gg', name: 'Mateo Salazar', city: 'Bogotá', mmr: 1150, photo: avatar('MS', '00575b', '00f4fe') },
    { email: 'isabella@clutch.gg', name: 'Isabella Moreno', city: 'Bogotá', mmr: 1100, photo: avatar('IM', '450900', 'ff7351') },
    { email: 'santiago@clutch.gg', name: 'Santiago Ospina', city: 'Cali', mmr: 1050, photo: avatar('SO', '1a2000', 'cafd00') },
    { email: 'mariana@clutch.gg', name: 'Mariana López', city: 'Bogotá', mmr: 980, photo: avatar('ML', '5b4b00', 'ffd709') },
    { email: 'nicolas@clutch.gg', name: 'Nicolás Peña', city: 'Cali', mmr: 1310, photo: avatar('NP', '00575b', '00f4fe') },
    { email: 'daniela@clutch.gg', name: 'Daniela Muñoz', city: 'Bogotá', mmr: 1460, photo: avatar('DM', '1a2000', 'cafd00') },
    { email: 'samuel@clutch.gg', name: 'Samuel Cardona', city: 'Medellín', mmr: 1530, photo: avatar('SC', '450900', 'ff7351') },
    { email: 'gabriela@clutch.gg', name: 'Gabriela Reyes', city: 'Cali', mmr: 1180, photo: avatar('GR', '5b4b00', 'ffd709') },
  ];

  const insertedUsers: any[] = [];
  for (const u of usersData) {
    const matchesPlayed = Math.floor(20 + Math.random() * 100);
    const wins = Math.floor(matchesPlayed * (0.3 + Math.random() * 0.4));
    const [user] = await db.insert(schema.users).values({
      email: u.email,
      name: u.name,
      passwordHash,
      city: u.city,
      mmr: u.mmr,
      photoUrl: u.photo,
      conductScore: 3.0 + Math.random() * 2.0,
      matchesPlayed,
      wins,
      losses: matchesPlayed - wins,
      pushEnabled: true,
      matchReminder: true,
      joinNotify: true,
    }).onConflictDoNothing().returning();
    if (user) insertedUsers.push(user);
  }
  if (insertedUsers.length < 10) {
    const allUsers = await db.select().from(schema.users).limit(16);
    insertedUsers.length = 0;
    insertedUsers.push(...allUsers);
  }
  console.log(`    ✓ ${insertedUsers.length} users (con avatares)`);

  // ============================================
  // 3. Courts (8 canchas con fotos)
  // ============================================
  console.log('  → Courts...');
  const courtsData = [
    { name: 'Cancha Élite Norte', address: 'Cra 7 #152-40, Usaquén', city: 'Bogotá', lat: 4.711, lng: -74.0721, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[0] },
    { name: 'Arena Vortex', address: 'Cl 85 #15-30, Chapinero', city: 'Bogotá', lat: 4.695, lng: -74.055, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[1] },
    { name: 'Sintética Central', address: 'Cra 13 #63-20, Chapinero Alto', city: 'Bogotá', lat: 4.72, lng: -74.06, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[2] },
    { name: 'CyberDome X', address: 'Cl 100 #19A-55, Usaquén', city: 'Bogotá', lat: 4.705, lng: -74.065, surface: 'caucho', verified: false, photoUrl: COURT_PHOTOS[3] },
    { name: 'Cancha La 14', address: 'Av 6N #28N-50, Santa Mónica', city: 'Cali', lat: 3.4516, lng: -76.5320, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[4] },
    { name: 'Sintética El Limonar', address: 'Cra 56 #5-120, El Limonar', city: 'Cali', lat: 3.4072, lng: -76.5225, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[5] },
    { name: 'Cancha Alfaguara', address: 'Cl 10 #23-45, Alfaguara', city: 'Jamundí', lat: 3.2610, lng: -76.5394, surface: 'natural', verified: false, photoUrl: COURT_PHOTOS[6] },
    { name: 'Goles y Más Sur', address: 'Cra 50 #3-80, Valle del Lili', city: 'Cali', lat: 3.3748, lng: -76.5340, surface: 'sintética', verified: true, photoUrl: COURT_PHOTOS[7] },
  ];

  for (const c of courtsData) {
    await db.insert(schema.courts).values(c).onConflictDoNothing();
  }
  console.log(`    ✓ ${courtsData.length} courts (con fotos)`);

  // ============================================
  // 4. Matches
  // ============================================
  console.log('  → Matches...');

  // Helper for completed matches — Carlos (index 0) SIEMPRE participa
  async function createCompletedMatch(
    courtIdx: number, daysAgo: number, hour: number, result: 'team_a' | 'team_b',
    carlosTeam: 'team_a' | 'team_b', otherPlayers: number[],
    score?: string,
  ) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 0, 0, 0);
    const court = courtsData[courtIdx];
    const [match] = await db.insert(schema.matches).values({
      creatorId: insertedUsers[0].id, dateTime: d, courtName: court.name,
      courtLat: court.lat, courtLng: court.lng, status: 'completed',
      result: score ?? result,
    }).returning();

    // Carlos siempre en su equipo asignado
    const carlosSlot = carlosTeam === 'team_a' ? 0 : 5;
    const allSlots = Array.from({ length: 10 }, (_, i) => i);
    allSlots.splice(carlosSlot, 1); // quitar el slot de Carlos

    // Insertar Carlos
    const carlosWon = carlosTeam === result;
    const carlosDelta = carlosWon ? Math.floor(15 + Math.random() * 15) : -Math.floor(10 + Math.random() * 12);
    await db.insert(schema.matchPlayers).values({
      matchId: match.id, userId: insertedUsers[0].id,
      team: carlosTeam, confirmed: true,
    }).onConflictDoNothing();
    await db.insert(schema.eloHistory).values({
      userId: insertedUsers[0].id, matchId: match.id,
      mmrBefore: insertedUsers[0].mmr - carlosDelta, mmrAfter: insertedUsers[0].mmr,
    });

    // Insertar los otros 9 jugadores
    for (let i = 0; i < 9; i++) {
      const pi = otherPlayers[i % otherPlayers.length];
      const slot = allSlots[i];
      const team = slot < 5 ? 'team_a' : 'team_b';
      const won = team === result;
      const delta = won ? Math.floor(12 + Math.random() * 18) : -Math.floor(8 + Math.random() * 16);
      await db.insert(schema.matchPlayers).values({
        matchId: match.id, userId: insertedUsers[pi].id,
        team, confirmed: true,
      }).onConflictDoNothing();
      await db.insert(schema.eloHistory).values({
        userId: insertedUsers[pi].id, matchId: match.id,
        mmrBefore: insertedUsers[pi].mmr - delta, mmrAfter: insertedUsers[pi].mmr,
      });
    }
    return match;
  }

  // Open matches (futuros)
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(20, 30, 0, 0);
  const [m1] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[0].id, dateTime: tomorrow, courtName: courtsData[0].name,
    courtLat: courtsData[0].lat, courtLng: courtsData[0].lng, status: 'open',
  }).returning();
  for (let i = 0; i < 6; i++) await db.insert(schema.matchPlayers).values({ matchId: m1.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2); dayAfter.setHours(21, 0, 0, 0);
  const [m2] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[2].id, dateTime: dayAfter, courtName: courtsData[1].name,
    courtLat: courtsData[1].lat, courtLng: courtsData[1].lng, status: 'open',
  }).returning();
  for (let i = 2; i < 5; i++) await db.insert(schema.matchPlayers).values({ matchId: m2.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  const tonight = new Date(); tonight.setDate(tonight.getDate() + 1); tonight.setHours(22, 15, 0, 0);
  const [m3] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[1].id, dateTime: tonight, courtName: courtsData[3].name,
    courtLat: courtsData[3].lat, courtLng: courtsData[3].lng, status: 'open',
  }).returning();
  for (let i = 0; i < 9; i++) await db.insert(schema.matchPlayers).values({ matchId: m3.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  const caliDate = new Date(); caliDate.setDate(caliDate.getDate() + 1); caliDate.setHours(19, 0, 0, 0);
  const [m4] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[4].id, dateTime: caliDate, courtName: courtsData[4].name,
    courtLat: courtsData[4].lat, courtLng: courtsData[4].lng, status: 'open',
  }).returning();
  for (let i = 4; i < 7; i++) await db.insert(schema.matchPlayers).values({ matchId: m4.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  const caliDate2 = new Date(); caliDate2.setDate(caliDate2.getDate() + 1); caliDate2.setHours(21, 30, 0, 0);
  const [m5] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[12].id, dateTime: caliDate2, courtName: courtsData[5].name,
    courtLat: courtsData[5].lat, courtLng: courtsData[5].lng, status: 'open',
  }).returning();
  for (let i = 0; i < 7; i++) await db.insert(schema.matchPlayers).values({ matchId: m5.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  // Match 6: Open in Jamundí — Alfaguara (4/10)
  const jamundiDate = new Date(); jamundiDate.setDate(jamundiDate.getDate() + 1); jamundiDate.setHours(18, 0, 0, 0);
  const [m6] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[10].id, dateTime: jamundiDate, courtName: courtsData[6].name,
    courtLat: courtsData[6].lat, courtLng: courtsData[6].lng, status: 'open',
  }).returning();
  for (let i = 10; i < 14; i++) await db.insert(schema.matchPlayers).values({ matchId: m6.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  // Match 7: Open in Cali Sur — Goles y Más (2/10)
  const caliSurDate = new Date(); caliSurDate.setDate(caliSurDate.getDate() + 2); caliSurDate.setHours(20, 0, 0, 0);
  const [m7] = await db.insert(schema.matches).values({
    creatorId: insertedUsers[15].id, dateTime: caliSurDate, courtName: courtsData[7].name,
    courtLat: courtsData[7].lat, courtLng: courtsData[7].lng, status: 'open',
  }).returning();
  for (let i = 14; i < 16; i++) await db.insert(schema.matchPlayers).values({ matchId: m7.id, userId: insertedUsers[i].id }).onConflictDoNothing();

  // Completed matches — Carlos SIEMPRE participa
  // (courtIdx, daysAgo, hour, result, carlosTeam, otherPlayers[])
  await createCompletedMatch(2, 1, 19, 'team_a', 'team_a', [1,2,3,4,5,6,7,8,9], '4 - 2');
  await createCompletedMatch(1, 3, 20, 'team_b', 'team_b', [2,3,4,5,6,7,8,9,10], '1 - 3');
  await createCompletedMatch(3, 5, 19, 'team_a', 'team_b', [1,3,5,7,9,11,13,14,15], '5 - 2');
  await createCompletedMatch(4, 7, 21, 'team_b', 'team_a', [2,4,6,8,10,12,14,15,1], '1 - 4');
  await createCompletedMatch(0, 10, 20, 'team_a', 'team_a', [1,2,3,4,5,6,7,8,9], '3 - 1');
  await createCompletedMatch(5, 12, 18, 'team_a', 'team_a', [3,5,7,9,11,13,14,15,2], '2 - 0');
  await createCompletedMatch(7, 14, 21, 'team_b', 'team_b', [1,2,4,6,8,10,12,14,15], '2 - 5');
  await createCompletedMatch(2, 18, 19, 'team_a', 'team_b', [2,3,5,7,9,11,13,15,4], '6 - 3');
  await createCompletedMatch(6, 21, 20, 'team_b', 'team_a', [1,3,4,6,8,10,12,14,15], '0 - 3');
  await createCompletedMatch(3, 25, 19, 'team_a', 'team_a', [2,4,5,7,9,11,13,15,6], '3 - 2');

  // Add votes and conduct ratings to recent completed matches
  const completedMatches = await db.select({ id: schema.matches.id }).from(schema.matches)
    .where(eq(schema.matches.status, 'completed')).limit(5);
  for (const cm of completedMatches) {
    const players = await db.select({ userId: schema.matchPlayers.userId }).from(schema.matchPlayers)
      .where(eq(schema.matchPlayers.matchId, cm.id));
    // Get the match result to extract scores for votes
    const [matchData] = await db.select({ result: schema.matches.result }).from(schema.matches).where(eq(schema.matches.id, cm.id));
    const resultParts = matchData?.result?.split(' - ');
    const sA = resultParts ? Number(resultParts[0]) : undefined;
    const sB = resultParts ? Number(resultParts[1]) : undefined;

    for (let i = 0; i < Math.min(players.length, 8); i++) {
      await db.insert(schema.matchVotes).values({
        matchId: cm.id, userId: players[i].userId,
        vote: i < 5 ? 'team_a' : 'team_b',
        scoreA: sA,
        scoreB: sB,
      }).onConflictDoNothing();
    }
    for (let i = 0; i < Math.min(players.length, 5); i++) {
      for (let j = 0; j < Math.min(players.length, 5); j++) {
        if (i !== j) {
          await db.insert(schema.conductRatings).values({
            matchId: cm.id, raterId: players[i].userId, ratedId: players[j].userId,
            score: 3 + Math.floor(Math.random() * 3),
          }).onConflictDoNothing();
        }
      }
    }
  }

  console.log('    ✓ 15 matches (5 open + 10 completed con historial)');

  // ============================================
  // 5. Squads
  // ============================================
  console.log('  → Squads...');
  const [squad1] = await db.insert(schema.squads).values({
    name: 'Élite FC', tag: 'EFC', creatorId: insertedUsers[0].id, avgMmr: 1590,
  }).onConflictDoNothing().returning();
  if (squad1) {
    await db.insert(schema.squadMembers).values({ squadId: squad1.id, userId: insertedUsers[0].id, role: 'captain' }).onConflictDoNothing();
    await db.insert(schema.squadMembers).values({ squadId: squad1.id, userId: insertedUsers[1].id, role: 'member' }).onConflictDoNothing();
    await db.insert(schema.squadMembers).values({ squadId: squad1.id, userId: insertedUsers[2].id, role: 'member' }).onConflictDoNothing();
    console.log('    ✓ 1 squad (Élite FC, 3 miembros)');
  }

  // ============================================
  // 6. Friendships
  // ============================================
  console.log('  → Friendships...');
  const friendships = [
    { r: 0, a: 1, status: 'accepted' },
    { r: 0, a: 2, status: 'accepted' },
    { r: 0, a: 5, status: 'accepted' },
    { r: 1, a: 3, status: 'accepted' },
    { r: 2, a: 4, status: 'accepted' },
    { r: 3, a: 0, status: 'pending' },
    { r: 4, a: 0, status: 'pending' },
    { r: 12, a: 0, status: 'pending' },
  ];
  for (const f of friendships) {
    await db.insert(schema.friendships).values({
      requesterId: insertedUsers[f.r].id,
      addresseeId: insertedUsers[f.a].id,
      status: f.status,
    }).onConflictDoNothing();
  }
  console.log(`    ✓ ${friendships.length} friendships (5 accepted, 3 pending)`);

  // ============================================
  // 7. Summary
  // ============================================
  console.log('');
  console.log('🎮 Seed complete!');
  console.log('');
  console.log('  📊 Data:');
  console.log(`  - ${insertedUsers.length} usuarios (con avatares generados)`);
  console.log('  - 8 canchas (con fotos de Unsplash)');
  console.log('  - 5 partidos abiertos + 10 completados');
  console.log('  - 1 escuadra (Élite FC)');
  console.log('  - 8 amistades');
  console.log('');
  console.log('  🔑 Credenciales:');
  console.log('  Email: carlos@clutch.gg');
  console.log('  Password: password123');
  console.log('  (Los 16 usuarios usan la misma contraseña)');
  console.log('');
  console.log('  Carlos tiene:');
  console.log('  - 3 amigos aceptados (Sofía, Diego, Camila)');
  console.log('  - 3 solicitudes pendientes (Valentina, Andrés, Nicolás)');
  console.log('  - Capitán de Élite FC');
  console.log('');

  await client.end();
  process.exit(0);
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
