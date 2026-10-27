# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm ci

FROM deps AS build
COPY packages/core packages/core
COPY apps/web apps/web
RUN npm run build --workspace=@aib-sitac/core \
  && npm run build --workspace=@aib-sitac/web \
  && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web ./apps/web
COPY --from=build /app/packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist
RUN mkdir -p node_modules/@aib-sitac \
  && ln -sfn ../../packages/core node_modules/@aib-sitac/core
CMD ["npm", "run", "start", "--workspace=@aib-sitac/web"]
