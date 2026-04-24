# Clutch.gg — Parámetros de Configuración

> Todos los parámetros se almacenan en la tabla `config` de PostgreSQL y se exponen via `GET /api/config`.
> El frontend los lee al iniciar la app y los cachea en memoria. El backend los cachea 60 segundos.
>
> **Para cambiar un valor sin hacer build:**
> ```sql
> UPDATE config SET value = 30, updated_at = NOW() WHERE key = 'nearby_radius_km';
> ```
> El cambio se refleja en la app en máximo 60 segundos.

---

## Match

### `max_players`
- **Default:** `10`
- **Tipo:** integer
- **Propósito:** Número máximo de jugadores por partido. Define cuándo el partido se considera "lleno" y se dispara el auto-draft de equipos.
- **Afecta:**
  - Backend: validación al unirse (`match-join.service.ts`), trigger del draft al llenarse
  - Frontend: slots vacíos en el lobby, progress bar del MatchCard, formato mostrado ("5 VS 5")
- **Ejemplo:** Cambiar a `14` para partidos 7v7

### `team_size`
- **Default:** `5`
- **Tipo:** integer
- **Propósito:** Jugadores por equipo. Debe ser `max_players / 2`.
- **Afecta:**
  - Backend: algoritmo de draft serpentine (cuántos asignar por equipo)
  - Frontend: display del formato ("5 VS 5"), columnas de equipos en lobby
- **Ejemplo:** Cambiar a `7` junto con `max_players = 14`

### `vote_threshold`
- **Default:** `0.6`
- **Tipo:** float (0 a 1)
- **Propósito:** Porcentaje de votos necesarios para resolver el resultado de un partido. Con 10 jugadores y threshold 0.6, se necesitan 6 votos del mismo equipo para confirmar el ganador.
- **Afecta:**
  - Backend: `voting.service.ts` calcula `ceil(max_players * vote_threshold)` como umbral
  - Una vez alcanzado: se actualiza el resultado del partido, se dispara el cálculo de ELO
- **Ejemplo:** Cambiar a `0.5` para que solo se necesite mayoría simple (5 de 10)

### `min_hours_ahead`
- **Default:** `5`
- **Tipo:** integer (horas)
- **Propósito:** Mínimo de horas en el futuro que debe tener un partido al crearse. Evita crear partidos que empiezan en minutos sin tiempo para que otros se unan.
- **Afecta:**
  - Frontend: validación en la pantalla de crear partido (fecha/hora mínima)
  - Si el usuario selecciona una fecha/hora dentro de las próximas N horas, muestra warning y deshabilita el botón publicar
- **Ejemplo:** Cambiar a `2` para permitir partidos más espontáneos

### `nearby_radius_km`
- **Default:** `50`
- **Tipo:** integer (kilómetros)
- **Propósito:** Radio de búsqueda para el filtro "Cerca de ti" en la pantalla Explorar. Usa GPS del usuario y fórmula Haversine para calcular distancia a cada partido.
- **Afecta:**
  - Frontend: hook `useMatchesNearby` envía este valor como `radius` en metros al backend
  - Backend: query SQL filtra partidos cuya distancia al usuario sea menor al radio
- **Ejemplo:** Cambiar a `30` en producción (ciudades más densas), dejar en `50` para zonas rurales

---

## ELO / MMR

### `initial_mmr`
- **Default:** `1000`
- **Tipo:** integer
- **Propósito:** MMR asignado a un jugador nuevo al registrarse. Define el punto de partida en el sistema de ranking.
- **Afecta:**
  - Backend: se asigna al crear usuario en `auth.service.ts`
  - Determina en qué rango empieza el jugador (1000 = Bronce)
- **Ejemplo:** Cambiar a `1200` si quieres que nuevos jugadores empiecen en Plata

### `mmr_variance`
- **Default:** `0.2`
- **Tipo:** float (0 a 1)
- **Propósito:** Varianza aplicada al MMR inicial para que no todos empiecen exactamente igual. Con 0.2, un jugador nuevo obtiene entre 800 y 1200 MMR (1000 ± 20%).
- **Afecta:**
  - Backend: `generateInitialMmr()` en shared utils
  - Crea diversidad natural en el matchmaking desde el primer partido
- **Ejemplo:** Cambiar a `0` para que todos empiecen exactamente en `initial_mmr`

### `k_factor_new`
- **Default:** `32`
- **Tipo:** integer
- **Propósito:** Factor K del sistema ELO para jugadores nuevos (menos de `veteran_threshold` partidos). Un K-factor alto significa que el MMR cambia más por partido — los nuevos jugadores se ubican rápido en su nivel real.
- **Afecta:**
  - Backend: `elo.processor.ts` usa este valor para calcular cuánto sube/baja el MMR
  - Un nuevo jugador que gana contra un equipo promedio gana ~16-32 puntos
  - Un nuevo jugador que pierde baja ~16-32 puntos
- **Ejemplo:** Cambiar a `40` para calibración aún más rápida

### `k_factor_veteran`
- **Default:** `16`
- **Tipo:** integer
- **Propósito:** Factor K para jugadores veteranos (≥`veteran_threshold` partidos). Más bajo que el de nuevos para que el ranking se estabilice con el tiempo.
- **Afecta:**
  - Backend: mismo cálculo ELO pero con menor variación por partido
  - Un veterano que gana/pierde solo mueve ~8-16 puntos
- **Ejemplo:** Cambiar a `12` para rankings aún más estables, o `20` para más dinamismo

### `veteran_threshold`
- **Default:** `20`
- **Tipo:** integer (partidos jugados)
- **Propósito:** Número de partidos después del cual un jugador pasa de "nuevo" a "veterano" para el cálculo de ELO. Antes de este umbral usa `k_factor_new`, después usa `k_factor_veteran`.
- **Afecta:**
  - Backend: condición `matchesPlayed < veteran_threshold ? k_factor_new : k_factor_veteran`
  - Define la "fase de calibración" del jugador
- **Ejemplo:** Cambiar a `10` para calibración más corta, o `30` para más datos antes de estabilizar

---

## Squad

### `max_squad_members`
- **Default:** `5`
- **Tipo:** integer
- **Propósito:** Número máximo de miembros por escuadra. Limita el tamaño del equipo fijo.
- **Afecta:**
  - Backend: validación en `squads.service.ts` al unirse (`if members.length >= max → error`)
  - Frontend: display de slots disponibles en la card de squad
- **Ejemplo:** Cambiar a `7` para squads más grandes, o `3` para tríos

---

## Arquitectura

```
┌─────────────┐     GET /api/config      ┌──────────────┐
│   Frontend   │ ◄──────────────────────► │   Backend    │
│  config.ts   │     (JSON con 11 keys)   │ ConfigParams │
│              │                          │   Service    │
│  hydrate()   │                          │              │
│  al startup  │                          │  Cache 60s   │
│              │                          │  + DB read   │
│  Fallback:   │                          │              │
│  env vars    │                          │  Defaults si │
│  si falla    │                          │  key no existe│
└─────────────┘                          └──────┬───────┘
                                                │
                                         ┌──────▼───────┐
                                         │  PostgreSQL   │
                                         │  tabla config │
                                         │  key | value  │
                                         └──────────────┘
```

### Cómo agregar un nuevo parámetro

1. **Backend** — Agregar default en `config-params.service.ts`:
   ```typescript
   const DEFAULT_CONFIG = {
     ...
     mi_nuevo_param: 42,
   };
   ```

2. **Frontend** — Agregar en `config.ts`:
   ```typescript
   const DEFAULTS = { ..., miNuevoParam: 42 };
   // En el objeto config:
   get miNuevoParam() { return _config.miNuevoParam; },
   // En hydrate():
   if (typeof remote.mi_nuevo_param === 'number') _config.miNuevoParam = remote.mi_nuevo_param;
   ```

3. **Usar** — `import { config } from '../config';` y leer `config.miNuevoParam`

4. **Cambiar en producción** — `UPDATE config SET value = 99 WHERE key = 'mi_nuevo_param';`

### Notas

- Los parámetros se auto-seedean al iniciar el backend si no existen en la DB
- El cache del backend tiene TTL de 60 segundos — cambios en la DB se reflejan en máximo 1 minuto
- El frontend cachea en memoria durante la sesión — se refresca al reabrir la app
- Si el endpoint `/api/config` no responde, el frontend usa defaults de env vars
- La tabla `config` usa `onConflictDoUpdate` para upserts seguros
