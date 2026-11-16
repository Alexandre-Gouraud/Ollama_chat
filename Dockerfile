FROM node:26-alpine AS base
# Node >= 25 n'embarque plus corepack : pnpm@12.21.0 (aligné sur le champ
# "packageManager" de package.json, utilisé aussi par la CI via
# pnpm/action-setup) est installé une fois dans l'étape de base. npm ne sert
# qu'à poser pnpm et est retiré de l'image finale (cf. runner).
RUN npm install -g pnpm@12.21.0 && pnpm --version

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Les scripts de build des dépendances sont réglés par allowBuilds dans
# pnpm-workspace.yaml.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV OLLAMA_BASE_URL=http://localhost:11434
ENV DEFAULT_MODEL=llama3.2
ENV MONGODB_URI=mongodb://localhost:27017/ollama_chat

RUN pnpm build

FROM base AS runner
WORKDIR /app

# Applique les correctifs de sécurité Alpine (ex. zlib CVE-2026-85091).
RUN apk upgrade --no-cache

ENV NODE_ENV=production

# npm/npx/corepack/pnpm ne sont jamais utilisés au runtime (CMD lance node
# directement) : on les retire pour réduire la surface d'attaque et éliminer
# les CVE de leurs dépendances embarquées (ex. tar fourni avec npm).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/lib/node_modules/pnpm \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx \
    /usr/local/bin/pn /usr/local/bin/pnx

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV OLLAMA_HOST=http://ollama:11434
ENV OLLAMA_BASE_URL=http://ollama:11434

# Vérifie uniquement que le serveur Next répond ; ne dépend pas d'Ollama ou de
# MongoDB (voir /api/ollama/health qui renvoie 503 quand Ollama est down).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
