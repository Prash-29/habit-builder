# 1. deps — install node_modules from lockfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# 2. builder — build the Next.js app (produces .next/standalone)
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. runner — slim final image, runs the standalone server as non-root
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# unprivileged user to run the process (security)
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# standalone output is split: server + static assets + public dir
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
