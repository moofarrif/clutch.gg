# Clutch.gg -- Variables de Entorno

> Este documento describe todas las variables de entorno utilizadas en el proyecto.
> Los valores reales de secretos **nunca** deben comprometerse en el repositorio.

---

## Backend (`apps/api`)

Archivos: `.env`, `.env.development`, `.env.production`, `.env.example`

| Variable | Requerida | Default | Descripcion | Dev | Production |
|----------|-----------|---------|-------------|-----|------------|
| `NODE_ENV` | Si | `development` | Entorno de ejecucion | `development` | `production` |
| `PORT` | No | `3000` | Puerto del servidor HTTP | `3000` | `3000` |
| `DATABASE_URL` | Si | -- | Connection string de PostgreSQL | `postgresql://clutch:clutch_dev@localhost:5432/clutch` | `postgresql://<user>:<pass>@<host>:5432/clutch` |
| `REDIS_URL` | Si | -- | Connection string de Redis | `redis://localhost:6380` | `redis://<host>:6379` |
| `JWT_SECRET` | Si | -- | Secreto para firmar access tokens | `dev-jwt-secret-change-in-prod` | `<openssl rand -hex 32>` |
| `JWT_REFRESH_SECRET` | Si | -- | Secreto para firmar refresh tokens | `dev-refresh-secret-change-in-prod` | `<openssl rand -hex 32>` |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Tiempo de vida del access token | `15m` | `15m` |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Tiempo de vida del refresh token | `7d` | `7d` |
| `ALLOWED_ORIGINS` | Si | -- | Origenes CORS permitidos (separados por coma) | `http://localhost:8081,http://localhost:3000` | `https://clutch.gg,https://app.clutch.gg` |
| `CLOUDINARY_CLOUD_NAME` | No* | -- | Nombre del cloud en Cloudinary (para avatares) | _(vacio)_ | `<tu-cloud-name>` |
| `CLOUDINARY_API_KEY` | No* | -- | API key de Cloudinary | _(vacio)_ | `<tu-api-key>` |
| `CLOUDINARY_API_SECRET` | No* | -- | API secret de Cloudinary | _(vacio)_ | `<tu-api-secret>` |
| `GOOGLE_CLIENT_ID` | No* | -- | Client ID de Google OAuth | _(vacio)_ | `<tu-google-client-id>` |
| `EXPO_ACCESS_TOKEN` | No | -- | Token de acceso para Expo push notifications | _(vacio)_ | `<tu-expo-token>` |

> \* Requerida en produccion para funcionalidad completa (upload de avatares, login con Google).

---

## Frontend (`apps/mobile`)

Archivos: `.env`, `.env.production`, `.env.example`

| Variable | Requerida | Default | Descripcion | Dev | Production |
|----------|-----------|---------|-------------|-----|------------|
| `EXPO_ROUTER_APP_ROOT` | Si | -- | Directorio raiz de rutas de Expo Router | `src/app` | `src/app` |
| `EXPO_PUBLIC_API_URL` | Si | -- | URL base de la API backend | `http://localhost:3000` o `http://192.168.x.x:3000` | `https://api.clutch.gg` |
| `EXPO_PUBLIC_ENV` | Si | -- | Entorno actual de la app | `development` | `production` |
| `EXPO_PUBLIC_TERMS_URL` | Si | -- | URL de la pagina de terminos y condiciones | `https://www.google.com` (placeholder) | `https://clutch.gg/terms` |
| `EXPO_PUBLIC_PRIVACY_URL` | Si | -- | URL de la politica de privacidad | `https://www.google.com` (placeholder) | `https://clutch.gg/privacy` |
| `EXPO_PUBLIC_STATUS_URL` | Si | -- | URL de la pagina de estado del servicio | `https://www.google.com` (placeholder) | `https://status.clutch.gg` |
| `EXPO_PUBLIC_NEARBY_RADIUS_KM` | No | `50` | Radio por defecto para busqueda de partidos cercanos (km) | `50` | `30` |
| `EXPO_PUBLIC_MIN_HOURS_AHEAD` | No | `5` | Horas minimas de anticipacion para crear un partido | `5` | `5` |

> Todas las variables `EXPO_PUBLIC_*` son visibles en el bundle del cliente. No incluir secretos aqui.

---

## Notas de Seguridad

### Secretos (NUNCA commitear valores reales)

Las siguientes variables contienen secretos y deben manejarse via gestor de secretos o variables de entorno del servidor:

- `DATABASE_URL` -- contiene credenciales de la base de datos
- `REDIS_URL` -- puede contener credenciales
- `JWT_SECRET` -- si se filtra, cualquiera puede generar tokens validos
- `JWT_REFRESH_SECRET` -- mismo riesgo que JWT_SECRET
- `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` -- acceso al servicio de almacenamiento
- `EXPO_ACCESS_TOKEN` -- permite enviar push notifications
- `GOOGLE_CLIENT_ID` -- no es secreto per se, pero debe protegerse

### Seguro para commitear

Los siguientes archivos **pueden** commitearse al repositorio ya que no contienen secretos reales:

- `apps/mobile/.env.example` -- valores placeholder
- `apps/api/.env.example` -- valores placeholder

### NO commitear

- `apps/api/.env` -- contiene credenciales de desarrollo
- `apps/api/.env.production` -- contiene (o contendra) credenciales de produccion
- `apps/mobile/.env` -- contiene IP local del desarrollador

---

## Generacion de Secretos

Para generar valores seguros para JWT:

```bash
# Generar JWT_SECRET
openssl rand -hex 32

# Generar JWT_REFRESH_SECRET
openssl rand -hex 32
```
