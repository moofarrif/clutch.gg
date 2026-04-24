# Clutch.gg -- Flujos de Usuario

Documentacion completa de todos los flujos de la app, paso a paso.

---

## Maquina de Estados del Partido

```
open --> full --> drafting --> playing --> voting --> completed
  |                                                     ^
  +---> cancelled                                       |
                                                  (ELO calculado)
```

| Estado      | Descripcion                                              |
|-------------|----------------------------------------------------------|
| `open`      | Aceptando jugadores (slots disponibles)                  |
| `full`      | 10/10 jugadores inscritos, esperando draft               |
| `drafting`  | El algoritmo serpentina esta asignando equipos            |
| `playing`   | Equipos asignados (A y B), partido en curso              |
| `voting`    | Jugadores votando el resultado                           |
| `completed` | Resultado confirmado, ELO calculado                      |
| `cancelled` | Partido cancelado (creador lo elimino estando solo)      |

Constantes clave (`packages/shared/src/constants/match.ts`):
- `MAX_PLAYERS`: 10
- `TEAM_SIZE`: 5
- `VOTE_THRESHOLD`: 0.6 (60% de votos = 6 de 10 jugadores)

---

## 1. Onboarding (Primera apertura)

**Pantalla:** `(auth)/onboarding.tsx`

| Paso | Usuario                              | App                                                              | Backend       |
|------|--------------------------------------|------------------------------------------------------------------|---------------|
| 1    | Abre la app por primera vez          | Detecta que no ha completado onboarding (localStorage)           | --            |
| 2    | Ve slide 1: "Encuentra partidos cerca de ti" | Muestra carrusel horizontal con 3 slides animados (FadeInUp)     | --            |
| 3    | Desliza o toca "SIGUIENTE"           | Avanza al slide 2: "Equipos balanceados" (sistema MMR)           | --            |
| 4    | Desliza o toca "SIGUIENTE"           | Avanza al slide 3: "Sube de rango" (sistema ELO/rangos)         | --            |
| 5    | Toca "EMPEZAR"                       | Solicita permisos de ubicacion (`expo-location`)                 | --            |
| 6    | Acepta/rechaza ubicacion             | Solicita permisos de notificaciones (`expo-notifications`)       | --            |
| 7    | Acepta/rechaza notificaciones        | Marca onboarding como completado, redirige a `sign-in`           | --            |

**Nota:** El usuario puede tocar "SALTAR" en cualquier momento para ir directo al login (los permisos se solicitan igualmente).

---

## 2. Registro (Crear Perfil)

**Pantalla:** `(auth)/create-profile.tsx`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Desde sign-in, toca "Crear Cuenta"   | Navega a pantalla de crear perfil                                | --                                         |
| 2    | Toca el circulo de avatar            | Abre selector de imagen (`useImageUpload`)                       | --                                         |
| 3    | Selecciona foto (opcional)           | Sube imagen al servidor, muestra preview                         | Guarda imagen, retorna URL                 |
| 4    | Escribe nombre (min 2 chars)         | Valida en tiempo real                                            | --                                         |
| 5    | Escribe email (debe contener @)      | Valida en tiempo real                                            | --                                         |
| 6    | Escribe contrasena (min 8 chars)     | Valida en tiempo real, habilita boton                            | --                                         |
| 7    | Toca "Entrar a la Arena"             | Muestra "Creando cuenta...", llama `useRegister`                 | Crea usuario con MMR inicial (1000), hashea password, retorna JWT |
| 8    | --                                   | Guarda token, navega al tab principal                            | --                                         |

**Error 409:** "Este email ya esta registrado"

---

## 3. Inicio de Sesion (Login)

**Pantalla:** `(auth)/sign-in.tsx`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Escribe email                        | Campo con autoCapitalize=none, keyboardType=email-address        | --                                         |
| 2    | Escribe contrasena                   | Campo secureTextEntry, toggle ojo para mostrar/ocultar           | --                                         |
| 3    | Toca "Iniciar Sesion"                | Muestra "Conectando...", llama `useLogin`                        | Valida credenciales, retorna JWT + perfil  |
| 4a   | (Exito)                              | Guarda token, navega al tab principal                            | --                                         |
| 4b   | (Error)                              | Shake animation en formulario + Alert "Email o contrasena incorrectos" | Retorna 401                                |

**Opciones adicionales:**
- Login social (Google / Apple) -- botones presentes, pendiente implementacion
- "Olvidaste tu contrasena?" -- muestra Alert con opcion de enviar enlace
- Links a Terminos, Privacidad y Estado del servicio

---

## 4. Crear Partido

**Pantalla:** `match/create.tsx`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Toca boton "+" o "Crear Partido"     | Abre pantalla de creacion                                        | --                                         |
| 2    | **Paso 01: Selecciona Cancha**       | Carga canchas cercanas con `useCourtsNearby` (radio 50km)       | Retorna canchas ordenadas por distancia    |
| 3    | Desliza carrusel horizontal          | Muestra cards con foto, nombre, superficie, distancia, verificada | --                                         |
| 4    | Toca una cancha                      | Marca como seleccionada (borde verde lima, check)                | --                                         |
| 5    | **Paso 02: Fecha y Hora**            | Muestra DateTimePicker nativo (iOS compact mode)                 | --                                         |
| 6    | Ajusta fecha                         | Valida que sea futuro, minimo `min_hours_ahead` horas            | --                                         |
| 7    | Ajusta hora                          | Intervalos de 5 minutos                                          | --                                         |
| 8    | Toca "Publicar Partido"              | Llama `useCreateMatch` con dateTime, courtName, lat, lng         | Crea match con status `open`, creador se une automaticamente |
| 9    | --                                   | Redirige a tab Explorar                                          | --                                         |

**Validaciones:**
- No se puede publicar sin cancha seleccionada
- No se puede publicar si la hora es < `min_hours_ahead` horas adelante (configurable, default 5h)
- Warning card roja si el horario es muy pronto

---

## 5. Unirse a Partido

**Pantalla:** `match/[id]/index.tsx` (Match Lobby)

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | En Explorar, toca card de partido    | Navega al lobby del partido                                      | --                                         |
| 2    | Ve hero con info: cancha, fecha, hora, status | Conexion Socket.io en tiempo real (`useMatchSocket`)             | --                                         |
| 3    | Ve plantel actual (XX/10)            | Lista de jugadores inscritos con nombre y MMR                    | --                                         |
| 4    | Ve slots vacios con "?"              | Slots dashed border indicando lugares disponibles                | --                                         |
| 5    | Toca "Unirse al Partido"             | Llama `useJoinMatch`, muestra animacion SuccessCheck             | Agrega player a match_players, emite via Socket |
| 6    | --                                   | Cambia CTA a "Estas inscrito" + boton "Salir"                   | --                                         |
| 7    | Espera mas jugadores                 | PulsingDot verde + "Esperando jugadores..."                      | Updates en tiempo real via Socket.io       |

**Compartir:** Boton de share para invitar amigos al partido.

---

## 6. Auto-Draft (Sorteo de Equipos)

**Procesador:** `matchmaking.processor.ts` (BullMQ queue: `matchmaking`)

| Paso | Trigger                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Se une el jugador #10               | --                                                               | Match status cambia a `full`, se encola job de draft |
| 2    | --                                   | Lobby muestra "Partido completo" con PulsingDot                  | Job inicia procesamiento                   |
| 3    | --                                   | --                                                               | Fetch 10 jugadores con su MMR              |
| 4    | --                                   | --                                                               | Status -> `drafting`, emite `matchStatusChanged` via Socket |
| 5    | --                                   | Lobby muestra "Sorteando equipos..."                             | Ordena jugadores por MMR descendente       |
| 6    | --                                   | --                                                               | Aplica patron **serpentina**: `[A, B, B, A, A, B, B, A, A, B]` |
| 7    | --                                   | --                                                               | Actualiza `match_players.team` en transaccion |
| 8    | --                                   | --                                                               | Status -> `playing`, emite `draftComplete` + `matchStatusChanged` |
| 9    | --                                   | Animacion SuccessCheck "Equipos sorteados!"                      | Push notification: "Los equipos han sido sorteados" |
| 10   | --                                   | Lobby muestra dos columnas: Equipo A vs Equipo B                 | --                                         |

**Algoritmo Serpentina:**
```
Jugadores ordenados por MMR (mayor a menor):
#1 -> Equipo A
#2 -> Equipo B
#3 -> Equipo B
#4 -> Equipo A
#5 -> Equipo A
#6 -> Equipo B
#7 -> Equipo B
#8 -> Equipo A
#9 -> Equipo A
#10 -> Equipo B
```
Esto balancea los equipos por nivel de habilidad.

---

## 7. Confirmar Asistencia

**Pantalla:** `match/[id]/index.tsx` (estado `playing`)

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Ve sus equipos asignados             | Lobby muestra Equipo A vs Equipo B con nombres y MMR             | --                                         |
| 2    | Toca "Confirmar Asistencia"          | Llama `useConfirmAttendance`                                     | Marca `match_players.confirmed = true`     |
| 3    | --                                   | Boton cambia a "Asistencia Confirmada" (verde, deshabilitado)    | --                                         |

---

## 8. Votar Resultado

**Pantalla:** `match/[id]/vote.tsx`
**Servicio:** `voting.service.ts`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Despues del partido, abre vote       | Muestra Equipo A vs Equipo B con MMR promedio y rango            | --                                         |
| 2    | Ingresa goles Equipo A               | TextInput numerico (max 2 digitos)                               | --                                         |
| 3    | Ingresa goles Equipo B               | TextInput numerico (max 2 digitos)                               | --                                         |
| 4    | Ve resultado calculado               | Outcome bar muestra "EQUIPO A", "EQUIPO B" o "EMPATE"           | --                                         |
| 5    | Marca asistencia de jugadores        | Toggle PRESENTE/AUSENTE por cada jugador                         | --                                         |
| 6    | Toca "ENVIAR RESULTADO"              | Llama `useVoteResult` con `team_a` o `team_b`                   | Inserta voto (upsert por matchId+userId)   |
| 7    | --                                   | SuccessCheck "Voto enviado!", redirige a pantalla de rating      | Cuenta votos totales                       |
| 8    | --                                   | --                                                               | Si votos >= threshold (6 de 10): determina ganador por mayoria |
| 9    | --                                   | --                                                               | Si threshold alcanzado: status -> `completed`, emite evento `match.result.confirmed` |
| 10   | --                                   | --                                                               | Encola job de calculo ELO                  |

**Logica de Threshold (voting.service.ts):**
- `threshold = ceil(max_players * vote_threshold)` = `ceil(10 * 0.6)` = **6 votos**
- Se usa `SELECT FOR UPDATE` para prevenir race conditions
- Si `teamAVotes >= threshold` o `teamBVotes >= threshold`, se resuelve
- El ganador es el equipo con mas votos

**Advertencia:** "EL ENVIO ES DEFINITIVO. AMBOS CAPITANES DEBEN CONFIRMAR."

---

## 9. Calificar Conducta

**Pantalla:** `match/[id]/rate.tsx`
**Procesador:** `elo.processor.ts` (BullMQ queue: `elo`)

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Llega desde vote exitoso             | Muestra "Victory Card" con delta ELO (+/- puntos)               | --                                         |
| 2    | Ve su rating actual y progreso       | Barra de progreso animada hacia siguiente rango                  | --                                         |
| 3    | Ve stats: partidos jugados, victorias | AnimatedCounter con valores actualizados                        | --                                         |
| 4    | Ve lista de companeros de equipo     | Solo muestra teammates (mismo equipo, excluyendo al usuario)     | --                                         |
| 5    | Toca estrellas (1-5) por cada companero | AnimatedStar con feedback visual                                | --                                         |
| 6    | Opcionalmente toca icono de reporte  | Boton de warning por cada jugador                                | --                                         |
| 7    | Toca "LISTO"                         | Llama `useRateConduct` con array de {userId, score}              | Inserta en `conduct_ratings`, actualiza `conductScore` promedio |
| 8    | --                                   | SuccessCheck "Calificacion enviada!", redirige a perfil          | --                                         |

**Calculo ELO (elo.processor.ts) -- se ejecuta en paralelo:**
1. Fetch jugadores con su MMR y equipo
2. Calcula MMR promedio por equipo
3. Para cada jugador: `calculateElo(mmr, opponentAvgMmr, won, matchesPlayed)`
4. Actualiza `users.mmr`, `matchesPlayed`, `wins`/`losses`
5. Inserta registro en `elo_history` (mmrBefore -> mmrAfter)
6. Status del match -> `completed`
7. Emite `matchResult` via Socket.io

---

## 10. Amigos

**Pantalla:** `friends/index.tsx`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Navega a pantalla de amigos          | Carga lista de amigos (`useFriends`) y solicitudes (`useFriendRequests`) | --                                         |
| 2    | Ve solicitudes pendientes            | Cards con avatar, nombre, MMR y rango del solicitante            | --                                         |
| 3a   | Toca "ACEPTAR"                       | Llama `useAcceptFriendRequest`                                   | Cambia `friendships.status` -> `accepted`  |
| 3b   | Toca "RECHAZAR"                      | Llama `useRejectFriendRequest`                                   | Elimina o marca como `rejected`            |
| 4    | Ve lista de amigos aceptados         | Cards con avatar, nombre, MMR y rango                            | --                                         |
| 5    | Toca un amigo                        | Navega al perfil del usuario (`user/[id]`)                       | --                                         |
| 6    | Pull-to-refresh                      | Recarga amigos y solicitudes                                     | --                                         |

**Enviar solicitud:** Desde el perfil de otro usuario se envia la solicitud de amistad.

---

## 11. Escuadra (Squad)

**Pantalla:** `squad/index.tsx`

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Navega a pantalla de escuadra        | Carga datos del squad (`useMySquad`)                             | --                                         |
| 2    | Ve nombre del squad, tag, y MMR avg  | Header con info del squad                                        | --                                         |
| 3    | Ve lista de miembros                 | Cards con: avatar, nombre, rol (Capitan/Delantero/Soporte/Defensa), rango, status (En Linea/En Partido/Ausente), barras de actividad | -- |
| 4    | Roles con colores:                   | Capitan=verde lima, Delantero=cyan, Soporte=terciario, Defensa=rojo | --                                         |

**Pantalla descubrir:** `squad/discover.tsx` permite buscar y unirse a squads existentes.

---

## 12. Eliminar Partido

**Pantalla:** `match/[id]/index.tsx` (condicion especial)

| Paso | Usuario                              | App                                                              | Backend                                    |
|------|--------------------------------------|------------------------------------------------------------------|--------------------------------------------|
| 1    | Creador es el unico jugador          | Boton "Salir" cambia a "Eliminar"                                | --                                         |
| 2    | Toca "Eliminar"                      | Alert de confirmacion: "Eres el unico jugador. Eliminar?"        | --                                         |
| 3    | Confirma "Eliminar"                  | Llama `useDeleteMatch`                                           | Elimina match y match_players asociados    |
| 4    | --                                   | Redirige a tab Explorar                                          | --                                         |

**Condicion:** Solo el creador (`isCreator`) puede eliminar, y solo cuando esta solo (`isAlone`, players <= 1). Si hay otros jugadores, el boton dice "Salir" y el creador simplemente abandona el partido.
