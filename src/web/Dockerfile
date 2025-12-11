# Build stage
FROM node:25-alpine AS builder
WORKDIR /app

# Copy package files
COPY src/web/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/web/ .

# Build the app (no API URL needed at build time anymore)
RUN npm run build

# Production stage
FROM node:25-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# API URL is now set at runtime via K8s deployment, not build time
# Default fallback - will be overridden by NEXT_PUBLIC_API_URL env var
ENV NEXT_PUBLIC_API_URL="https://localhost:5000"

CMD ["node", "server.js"]
