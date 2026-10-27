# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm ci

FROM deps AS build-core
COPY packages/core packages/core
RUN npm run build --workspace=@aib-sitac/core

FROM build-core AS build-api
COPY apps/api apps/api
RUN npm run build --workspace=@aib-sitac/api && npm prune --omit=dev

FROM build-core AS build-web
COPY apps/web apps/web
RUN npm run build --workspace=@aib-sitac/web

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-api /app/package.json /app/package-lock.json ./
COPY --from=build-api /app/node_modules ./node_modules
COPY --from=build-api /app/apps/api/package.json ./apps/api/package.json
COPY --from=build-api /app/apps/api/dist ./apps/api/dist
COPY --from=build-api /app/apps/api/sql ./apps/api/sql
COPY --from=build-api /app/packages/core/package.json ./packages/core/package.json
COPY --from=build-api /app/packages/core/dist ./packages/core/dist
RUN mkdir -p node_modules/@aib-sitac \
  && ln -sfn ../../packages/core node_modules/@aib-sitac/core
CMD ["node", "apps/api/dist/main.js"]

FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build-web /app /app
CMD ["npm", "run", "start", "--workspace=@aib-sitac/web"]
