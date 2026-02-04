# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies needed for Prisma and building
RUN apk add --no-cache libc6-compat openssl

# ---- Dependencies ----
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# ---- Builder ----
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (in case schema changed)
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner ----
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy entrypoint script
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Create data directory for SQLite and set permissions
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/vitamins.db"

# Start the application
ENTRYPOINT ["./entrypoint.sh"]
