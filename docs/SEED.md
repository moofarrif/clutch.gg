# Clutch.gg -- Datos de Prueba (Seed)

Archivo fuente: `apps/api/src/database/seed.ts`

---

## Como ejecutar

```bash
pnpm --filter api exec npx tsx src/database/seed.ts
```

**Importante:** El seed es **idempotente**. Antes de insertar datos, ejecuta `TRUNCATE CASCADE` en todas las tablas:
```
conduct_ratings, match_votes, elo_history, match_players, matches,
squad_members, squads, friendships, courts, config, users
```

---

## Credenciales de Acceso

Todos los 16 usuarios comparten la misma contrasena:

```
Password: password123
```

### Login rapido (copiar y pegar)

| Rol en seed           | Email                   | Password      |
|-----------------------|-------------------------|---------------|
| Protagonista / Capitan | carlos@clutch.gg       | password123   |
| Jugadora activa       | sofia@clutch.gg         | password123   |
| Jugador Medellin      | diego@clutch.gg         | password123   |
| Cualquier otro        | {nombre}@clutch.gg      | password123   |

---

## Usuarios (16)

| #  | Nombre             | Email                   | Ciudad    | MMR  | Rango aprox     |
|----|--------------------|-------------------------|-----------|------|-----------------|
| 0  | Carlos Mendoza     | carlos@clutch.gg        | Bogota    | 1742 | Alto            |
| 1  | Sofia Ramirez      | sofia@clutch.gg         | Bogota    | 1650 | Alto            |
| 2  | Diego Herrera       | diego@clutch.gg         | Medellin  | 1580 | Medio-Alto      |
| 3  | Valentina Castro    | valentina@clutch.gg     | Bogota    | 1490 | Medio           |
| 4  | Andres Vargas       | andres@clutch.gg        | Cali      | 1420 | Medio           |
| 5  | Camila Torres       | camila@clutch.gg        | Bogota    | 1350 | Medio           |
| 6  | Juan Pablo Rios     | juan@clutch.gg          | Bogota    | 1280 | Medio-Bajo      |
| 7  | Laura Gomez         | laura@clutch.gg         | Medellin  | 1200 | Medio-Bajo      |
| 8  | Mateo Salazar        | mateo@clutch.gg         | Bogota    | 1150 | Bajo            |
| 9  | Isabella Moreno     | isabella@clutch.gg      | Bogota    | 1100 | Bajo            |
| 10 | Santiago Ospina     | santiago@clutch.gg      | Cali      | 1050 | Bajo            |
| 11 | Mariana Lopez       | mariana@clutch.gg       | Bogota    | 980  | Bajo            |
| 12 | Nicolas Pena        | nicolas@clutch.gg       | Cali      | 1310 | Medio           |
| 13 | Daniela Munoz       | daniela@clutch.gg       | Bogota    | 1460 | Medio           |
| 14 | Samuel Cardona      | samuel@clutch.gg        | Medellin  | 1530 | Medio-Alto      |
| 15 | Gabriela Reyes      | gabriela@clutch.gg      | Cali      | 1180 | Bajo            |

**Notas sobre usuarios:**
- Cada usuario tiene entre 20-120 partidos jugados (aleatorio)
- Win rate entre 30%-70% (aleatorio)
- `conductScore` entre 3.0 y 5.0 (aleatorio)
- Todos tienen push notifications habilitadas
- Avatares generados con `ui-avatars.com` (colores tematicos por usuario)

---

## Canchas (8)

| #  | Nombre               | Direccion                           | Ciudad   | Superficie | Verificada |
|----|----------------------|-------------------------------------|----------|------------|------------|
| 0  | Cancha Elite Norte   | Cra 7 #152-40, Usaquen             | Bogota   | sintetica  | Si         |
| 1  | Arena Vortex         | Cl 85 #15-30, Chapinero            | Bogota   | sintetica  | Si         |
| 2  | Sintetica Central    | Cra 13 #63-20, Chapinero Alto      | Bogota   | sintetica  | Si         |
| 3  | CyberDome X          | Cl 100 #19A-55, Usaquen            | Bogota   | caucho     | No         |
| 4  | Cancha La 14         | Av 6N #28N-50, Santa Monica        | Cali     | sintetica  | Si         |
| 5  | Sintetica El Limonar | Cra 56 #5-120, El Limonar          | Cali     | sintetica  | Si         |
| 6  | Cancha Alfaguara     | Cl 10 #23-45, Alfaguara            | Jamundi  | natural    | No         |
| 7  | Goles y Mas Sur      | Cra 50 #3-80, Valle del Lili       | Cali     | sintetica  | Si         |

**Fotos:** Todas las canchas tienen fotos de Unsplash (URLs permanentes, 800x400 crop).

---

## Partidos

### Partidos Abiertos (7)

| Match | Cancha               | Creador            | Jugadores | Horario            |
|-------|----------------------|--------------------|-----------|--------------------|
| m1    | Cancha Elite Norte   | Carlos Mendoza     | 6/10      | Manana 20:30       |
| m2    | Arena Vortex         | Diego Herrera      | 3/10      | Pasado manana 21:00|
| m3    | CyberDome X          | Sofia Ramirez      | 9/10      | Manana 22:15       |
| m4    | Cancha La 14         | Andres Vargas      | 3/10      | Manana 19:00       |
| m5    | Sintetica El Limonar | Nicolas Pena       | 7/10      | Manana 21:30       |
| m6    | Cancha Alfaguara     | Santiago Ospina    | 4/10      | Manana 18:00       |
| m7    | Goles y Mas Sur      | Gabriela Reyes     | 2/10      | Pasado manana 20:00|

**Nota:** m3 con 9/10 jugadores es util para testear el auto-draft (solo falta 1 jugador).

### Partidos Completados (10)

Todos los partidos completados tienen a **Carlos Mendoza** como participante y creador.

| # | Cancha               | Dias atras | Hora  | Resultado | Carlos en     | Carlos gano |
|---|----------------------|------------|-------|-----------|---------------|-------------|
| 1 | Sintetica Central    | 1          | 19:00 | team_a    | team_a        | Si          |
| 2 | Arena Vortex         | 3          | 20:00 | team_b    | team_b        | Si          |
| 3 | CyberDome X          | 5          | 19:00 | team_a    | team_b        | No          |
| 4 | Cancha La 14         | 7          | 21:00 | team_b    | team_a        | No          |
| 5 | Cancha Elite Norte   | 10         | 20:00 | team_a    | team_a        | Si          |
| 6 | Sintetica El Limonar | 12         | 18:00 | team_a    | team_a        | Si          |
| 7 | Goles y Mas Sur      | 14         | 21:00 | team_b    | team_b        | Si          |
| 8 | Sintetica Central    | 18         | 19:00 | team_a    | team_b        | No          |
| 9 | Cancha Alfaguara     | 21         | 20:00 | team_b    | team_a        | No          |
| 10| CyberDome X          | 25         | 19:00 | team_a    | team_a        | Si          |

**Record de Carlos:** 6 victorias, 4 derrotas en los 10 partidos del seed.

Cada partido completado tiene:
- 10 jugadores con equipo asignado (team_a / team_b)
- Registros de `elo_history` (mmrBefore / mmrAfter) para cada jugador
- Los 5 mas recientes tienen ademas votos (`match_votes`) y calificaciones de conducta (`conduct_ratings`)

---

## Escuadra (1)

| Nombre    | Tag  | Creador          | MMR Promedio |
|-----------|------|------------------|--------------|
| Elite FC  | EFC  | Carlos Mendoza   | 1590         |

### Miembros

| Jugador          | Rol      |
|------------------|----------|
| Carlos Mendoza   | captain  |
| Sofia Ramirez    | member   |
| Diego Herrera    | member   |

---

## Amistades (8)

### Aceptadas (5)

| Solicitante        | Destinatario       |
|--------------------|--------------------|
| Carlos Mendoza     | Sofia Ramirez      |
| Carlos Mendoza     | Diego Herrera      |
| Carlos Mendoza     | Camila Torres      |
| Sofia Ramirez      | Valentina Castro   |
| Diego Herrera      | Andres Vargas      |

### Pendientes (3)

| Solicitante        | Destinatario       |
|--------------------|--------------------|
| Valentina Castro   | Carlos Mendoza     |
| Andres Vargas      | Carlos Mendoza     |
| Nicolas Pena       | Carlos Mendoza     |

**Resumen para Carlos:**
- 3 amigos aceptados: Sofia, Diego, Camila
- 3 solicitudes pendientes por aceptar: Valentina, Andres, Nicolas
- Capitan de Elite FC

---

## Config Params

| Key              | Valor | Descripcion                            |
|------------------|-------|----------------------------------------|
| initial_mmr      | 1000  | MMR al registrarse                     |
| mmr_variance     | 0.2   | Varianza aceptada para matchmaking     |
| vote_threshold   | 0.6   | % de votos necesarios para resolver    |
| max_players      | 10    | Jugadores por partido                  |
| min_hours_ahead  | 5     | Horas minimas de anticipacion          |

---

## Notas sobre Assets

- **Avatares:** Generados via `https://ui-avatars.com/api/` con iniciales del nombre, colores tematicos (verde/cyan/amarillo/naranja), formato PNG 200x200.
- **Fotos de canchas:** 8 URLs de Unsplash (permanentes, no requieren API key), crop 800x400. Incluyen canchas sinteticas, nocturnas, indoor y estadios.
