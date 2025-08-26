# Base stage
FROM node:22.18.0-alpine3.22 AS base 

WORKDIR /app

RUN addgroup -g 2003 nodejs && \
    adduser -S -u 2003 -G nodejs nodejs

# Deps stage
FROM base AS deps

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

# Run stage
FROM base AS production 

ENV NODE_ENV=production \
    PORT=3000

COPY --from=deps --chown=2003:2003 /app/node_modules ./node_modules
COPY --chown=2003:2003 . .

USER 2003:2003

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]