FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/core/package.json packages/core/package.json
RUN npm ci --ignore-scripts
COPY packages/core packages/core
COPY apps/web apps/web
RUN npm run build --workspace=@aib-sitac/core && npm run build --workspace=@aib-sitac/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@aib-sitac/web"]
