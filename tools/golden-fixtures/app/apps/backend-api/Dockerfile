FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* .npmrc ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=prod
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npx", "ts-node", "-T", "-r", "tsconfig-paths/register", "apps/backend-api/src/main.ts"]
