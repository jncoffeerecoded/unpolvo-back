# syntax=docker/dockerfile:1

# ---- Builder ----
FROM node:22-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# npm install (no ci): sharp necesita binarios Linux que el lockfile de otra
# plataforma puede no incluir. postinstall ejecuta `prisma generate`.
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3008
# Railway define $PORT; main.ts lo respeta y escucha en 0.0.0.0.
CMD ["node", "dist/main.js"]
