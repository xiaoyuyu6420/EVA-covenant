# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint script: run DB migration + seed on startup
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/sh
set -e
echo "Running database migration..."
npx prisma db push --skip-generate

# Only seed if DB is empty
COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.question.count().then(c => { console.log(c); p.\$disconnect(); });
" 2>/dev/null)
if [ "$COUNT" = "0" ]; then
  echo "Seeding database..."
  npx tsx prisma/seed.ts
else
  echo "Database already seeded, skipping."
fi

echo "Starting server..."
exec node server.js
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/entrypoint.sh"]
