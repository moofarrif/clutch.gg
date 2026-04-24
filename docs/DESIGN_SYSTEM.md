# Clutch.gg — Sistema de Diseño

> Estética **Kinetic Pro / Precision Velocity** — gaming competitivo, dark-mode, data-first.

---

## Principios Fundamentales

1. **Profundidad tonal, no bordes** — Separar secciones con variaciones de superficie, nunca con líneas de 1px.
2. **Asimetría intencional** — Layouts con vacío deliberado. No llenar todo el espacio.
3. **Data-first** — Los números grandes (MMR, scores, porcentajes) son los protagonistas visuales.
4. **Micro-interacciones** — Transiciones de 200ms con spring easing.
5. **Jerarquía tipográfica extrema** — Títulos gigantes italic vs labels diminutas uppercase = máximo contraste visual.
6. **Accesibilidad WCAG AA** — Todos los pares texto/fondo deben tener contraste ≥ 4.5:1.
7. **Iconos vectoriales, no emojis** — Usar componente `<Icon>` siempre. Prohibido usar emojis como iconos.

---

## Paleta de Colores

### Tokens Principales

| Token | Hex | Uso |
|-------|-----|-----|
| primary | #f3ffca | Textos destacados, títulos activos |
| primaryContainer | #cafd00 | CTAs, badges, gradientes, victorias |
| primaryDim | #beee00 | Variante suave de primary |
| secondary | #00f4fe | Rangos diamond, MMR, acentos competitivos |
| secondaryDim | #00e5ee | Variante suave de secondary |
| tertiary | #ffe792 | Rangos gold, logros |
| tertiaryContainer | #ffd709 | Estrellas conducta, badges gold |
| tertiaryDim | #efc900 | Variante gold sólida |
| error | #ff7351 | Derrotas, alertas, trending down |
| errorDim | #d53d18 | Report buttons, errores suaves |

### Superficies (escala de profundidad)

| Token | Hex | Nivel |
|-------|-----|-------|
| surfaceContainerLowest | #000000 | 0 — Fondo absoluto |
| background / surface | #0e0e10 | 1 — Fondo principal |
| surfaceContainerLow | #131315 | 2 — Inputs, rows secundarias |
| surfaceContainer | #19191c | 3 — Cards nivel 1, appbar bg |
| surfaceContainerHigh | #1f1f22 | 4 — Match cards, inputs con borde |
| surfaceContainerHighest | #262528 | 5 — Bento cards, chips |
| surfaceBright | #2c2c2f | 6 — Hover states |

### Texto

| Token | Hex | Contraste vs background | Uso |
|-------|-----|------------------------|-----|
| onSurface | #f9f5f8 | 28.8:1 ✅ | Texto principal |
| onSurfaceVariant | #adaaad | 9.7:1 ✅ | Texto secundario, labels |
| outline | #918f92 | 5.3:1 ✅ | Texto terciario, placeholders |
| outlineVariant | #48474a | 1.8:1 ❌ | **Solo bordes**, nunca para texto |

### On-Colors

| Token | Hex | Sobre |
|-------|-----|-------|
| onPrimary | #1a2000 | Texto en CTAs primaryContainer |
| onPrimaryContainer | #1a2000 | Texto en badges primaryContainer |
| onPrimaryFixed | #3a4a00 | Texto oscuro en primary |
| onSecondary | #00575b | Texto en badges secondary |

### Colores de Rango

| Rango | Hex | Token |
|-------|-----|-------|
| Bronce | #cd7f32 | `colors.bronze` |
| Plata | #c0c0c0 | — |
| Oro | #efc900 | `colors.tertiaryDim` |
| Platino | #cafd00 | `colors.primaryContainer` |
| Diamante | #00f4fe | `colors.secondary` |

### Utilidad `withOpacity`

```typescript
import { withOpacity } from '../theme';

// Correcto:
withOpacity(colors.secondary, 0.15)    // → '#00f4fe26'
withOpacity(colors.background, 0.92)   // → '#0e0e10eb'

// Incorrecto — NO hacer:
colors.secondary + '26'               // ❌ hex-suffix manual
'rgba(0,244,254,0.15)'               // ❌ rgba hardcodeado
```

---

## Tipografía

### Familias

| Familia | Font | Rol |
|---------|------|-----|
| headline | Space Grotesk | Títulos, scores, nombres |
| body | Manrope | Descripciones, párrafos |
| label | Lexend | Badges, metadata, botones |

### Headlines (Space Grotesk) — siempre uppercase, tracking negativo
- displayLarge: 72px, 900, letterSpacing:-2, italic, lineHeight:80
- displayMedium: 48px, 900, letterSpacing:-1.5, italic, lineHeight:58
- headlineLarge: 32px, 800, letterSpacing:-1, lineHeight:40
- headlineMedium: 24px, 700, letterSpacing:-0.5, lineHeight:30
- headlineSmall: 20px, 700, letterSpacing:-0.5, lineHeight:26
- score: 40px, 900, letterSpacing:-1, italic, lineHeight:48

> **Importante**: Siempre agregar `lineHeight` a textos italic. RN no expande el bounding box.

### Body (Manrope) — nunca uppercase
- bodyLarge: 16px, 400, lineHeight:24
- bodyMedium: 14px, 400, lineHeight:20
- bodySmall: 12px, 400, lineHeight:16

### Labels (Lexend) — siempre uppercase, tracking positivo
- labelLarge: 14px, 700, letterSpacing:2
- labelMedium: 12px, 700, letterSpacing:2
- labelSmall: 10px, 700, letterSpacing:3
- labelTiny: 8px, 700, letterSpacing:4

---

## Espaciado

| Token | Valor |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |
| 4xl | 64px |

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| sm | 6px | Badges, chips pequeños |
| md | 12px | Inputs, cards internas |
| lg | 16px | Cards principales, containers |
| xl | 24px | Modals, secciones grandes |
| full | 9999px | Pills, CTAs, avatares circulares |

> Siempre `borderCurve: 'continuous'` en React Native.

---

## Iconos

Usar **siempre** el componente `<Icon>` de `components/atoms/Icon.tsx`.

```tsx
import { Icon } from '../components/atoms';

<Icon name="search" size={22} color={colors.outline} />
<Icon name="trophy" size={24} color={colors.primaryContainer} />
```

**Prohibido**: emojis como iconos (⚽, 🏆, 👤, etc.)

### Fuentes de iconos
- **Ionicons** — navegación, UI general
- **MaterialCommunityIcons** — iconos deportivos (soccer, crown, diamond, whistle)

Ambos vienen incluidos en Expo Go via `@expo/vector-icons`.

---

## Sombras

Tinte del color de acento, nunca negro puro.

| Preset | Uso |
|--------|-----|
| glow | Efectos lime generales |
| appBar | Top app bar |
| navBar | Bottom nav bar (tinte cyan) |
| ctaLime | Botones CTA principales |
| ctaCyan | Headers con acento cyan |

---

## Componentes

### Card (`components/atoms/Card.tsx`)

```tsx
<Card surface="container" padding="lg" radius="lg">
  {children}
</Card>
```

Props: `surface` (container/containerHigh/containerHighest/containerLow), `padding`, `radius`, `borderColor`

### SectionHeader (`components/molecules/SectionHeader.tsx`)

```tsx
<SectionHeader
  title="Partidos en Vivo"
  titleColor="primaryContainer"
  subtitle="3 partidos encontrados"
  rightLabel="Ver Todos"
  onRightPress={() => router.push('/matches')}
/>
```

Auto-agrega `accessibilityRole="header"`.

### Botones (`theme/buttons.ts`)

| Variante | Fondo | Texto | Uso |
|----------|-------|-------|-----|
| primary | primaryContainer (#cafd00) | onPrimaryContainer (#1a2000) | CTA principal |
| secondary | secondary (#00f4fe) | onSecondary (#00575b) | Acciones secundarias |
| ghost | surfaceContainerHighest | onSurface | Acciones terciarias |
| accent | white | black | Invitaciones, acciones especiales |
| danger | errorContainer | onErrorContainer | Acciones destructivas |
| disabled | surfaceContainerHigh | outlineVariant | Se aplica sobre cualquier variante |

```tsx
<AnimatedPressable
  style={[buttonStyles.primary, disabled && buttonStyles.disabled]}
  disabled={disabled}
>
  <Text style={[buttonStyles.primaryText, disabled && buttonStyles.disabledText]}>
    Publicar Partido
  </Text>
</AnimatedPressable>
```

---

## Patrones de Componentes

### Match Card
- Rank accent bar: 6x48px top-right (color por tier)
- Imagen cancha + distance badge
- Nombre cancha: headlineMedium 800 uppercase
- Player count: score 900 italic
- Progress bar + CTA pill

### Bento Stats Grid
- 2 columnas, gap:12
- bg surfaceContainerHighest, borderRadius: radii.lg, minHeight:128
- Icono bg: absolute, opacity:10%

### Recent Match Card
- Sidebar 6px (primaryContainer=victoria, error=derrota, outline=empate)
- bg surfaceContainer

### Top App Bar
- bg `withOpacity(colors.background, 0.7-0.92)`, shadow appBar
- Logo: SpaceGrotesk 900 italic 24px primaryContainer

### Bottom Nav Bar
- bg surfaceContainer, shadow navBar
- Active: primaryContainer, bg surfaceContainerHighest
- Labels: Lexend 10px semibold uppercase

---

## Reglas de Implementación

### Código
- StyleSheet.create() para estilos, inline solo para 1-2 props dinámicas
- `borderCurve: 'continuous'` siempre
- Colores desde `theme/colors.ts`, nunca hardcodear hex
- Opacidades con `withOpacity()`, nunca concatenar hex suffix
- `shadow()` de `theme/shadows.ts` para sombras cross-platform
- `buttonStyles` de `theme/buttons.ts` para todos los botones
- `<Icon>` de `components/atoms/Icon.tsx` para todos los iconos
- Lógica de colores de rango centralizada en `utils/rank-colors.ts`

### Accesibilidad
- `accessibilityRole="button"` en todo Pressable/AnimatedPressable
- `accessibilityLabel` descriptivos en **español**
- `accessibilityRole="header"` en títulos de sección
- `accessibilityState={{ selected }}` en toggles/filtros
- `selectable` en datos copiables
- No usar color como único indicador de estado
- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande (18pt+)

### Estados
- Vacío: `<EmptyState icon="soccer" title="..." />` (usa IconName, no emojis)
- Loading: Skeleton (animación pulse)
- Error: ErrorMessage (con retry)
- Disabled: `buttonStyles.disabled` + `buttonStyles.disabledText`

### No hacer
- Bordes de 1px para separar secciones
- Cards blancas sobre fondo oscuro
- Sombras negras puras
- `experimental_backgroundImage`
- Colores hardcodeados fuera del theme
- `rgba()` strings — usar `withOpacity()`
- Emojis como iconos — usar `<Icon>`
- `colors.x + 'hex'` — usar `withOpacity(colors.x, decimal)`
- Data hardcodeada en pantallas — siempre usar hooks y datos del API

---

## Flujos de Producto

### Flujo de Partido Completo

```
Crear Partido → Seleccionar cancha + fecha/hora → Publicar
                                                     ↓
                                              Status: OPEN
                                              (Explorar muestra el partido)
                                                     ↓
                                         Jugadores se unen (1-9/10)
                                              (Real-time via Socket.io)
                                                     ↓
                                         10mo jugador se une
                                              Status: FULL
                                                     ↓
                                         BullMQ Draft Job automático
                                              Status: DRAFTING
                                              (Serpentine por MMR)
                                                     ↓
                                         Equipos asignados
                                              Status: PLAYING
                                              Socket: draftComplete
                                              Push: "¡Equipos asignados!"
                                                     ↓
                                         Confirmar asistencia
                                              (Cada jugador confirma)
                                                     ↓
                                         Partido se juega (presencial)
                                                     ↓
                                         Votar resultado (team_a o team_b)
                                              Status: VOTING → COMPLETED
                                              (Threshold: 60% de votos)
                                                     ↓
                                         ELO recalculado automáticamente
                                              (BullMQ ELO Job)
                                                     ↓
                                         Calificar conducta (1-5 estrellas)
                                              (Conduct score actualizado)
```

### Status del Match y UI

| Status | Badge | CTA | Roster |
|--------|-------|-----|--------|
| `open` | "Esperando jugadores..." (PulsingDot) | "Unirse" / "Salir" | Lista plana + slots vacíos |
| `full` | "Partido completo" | Deshabilitado | Lista plana completa |
| `drafting` | "Sorteando equipos..." | Deshabilitado | Lista plana (transición) |
| `playing` | "Equipos asignados ✓" | "Confirmar Asistencia" | Team A vs Team B (2 columnas) |
| `voting` | "Votación" | "Votar Resultado" | Teams + resultado |
| `completed` | "Finalizado" | "Calificar" | Teams + ELO deltas |

### Flujo de Amigos

```
Buscar usuario (GET /users/search?q=nombre)
       ↓
Ver perfil público (/user/[id])
       ↓
"Agregar amigo" (POST /friends/request)
       ↓
Solicitud pendiente (aparece en /friends)
       ↓
Aceptar/Rechazar (POST /friends/:id/accept|reject)
```

### Flujo de Escuadra

```
Crear escuadra (POST /squads) → Capitán automático
       ↓
Invitar jugadores / Jugadores solicitan unirse
       ↓
Máximo 5 miembros
       ↓
Squad se elimina automáticamente si queda vacío
```
