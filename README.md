# unpolvo-back

API REST (NestJS + Prisma) del marketplace de citas **unpolvo**. Es el backend
separado que consume el frontend (`unpolvo-front`): posee la base de datos, el
bucket de imágenes y la autenticación.

## Stack
NestJS 11 · Prisma (PostgreSQL) · JWT (Passport) · sharp (compresión a WebP) ·
S3-compatible (Tigris) · class-validator · Throttler (rate limiting).

## Desarrollo
```bash
npm install
npm run start:dev   # http://localhost:3008
```
Variables en `.env` (ver `.env.example`): `DATABASE_URL`, `JWT_SECRET`,
`FRONTEND_ORIGIN`, `S3_*`, `PUBLIC_BACKEND_URL`.

## Endpoints (resumen)
- **Auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- **Geo**: `GET /countries`, `/countries/:code`, `/countries/:code/cities/:slug`, `/countries-with-cities`
- **Perfiles**: `GET /profiles?country=&city=&featured=&take=`, `GET /profiles/:slug`, `GET /profiles/:slug/related`, `POST /profiles` (multipart, auth)
- **Social** (auth): `POST /profiles/:id/comments`, `DELETE /comments/:id`, `POST /profiles/:id/like`, `PUT /profiles/:id/rating`, `GET /profiles/:id/interaction`
- **Mis anuncios** (auth): `GET /me/profiles`
- **Notificaciones** (auth): `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/read`
- **Imágenes**: `GET /img/profiles/:file` (sirve del bucket)
- **Health**: `GET /health`

## Deploy (Railway)
Build con `Dockerfile` (ver `railway.json`). Define las variables de entorno en
el servicio. Healthcheck en `/health`.
