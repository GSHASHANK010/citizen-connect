# Builds the web app, then runs the API which also serves that build.
# One container = the whole product. Needs DATABASE_URL at runtime.

FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Optional map settings baked into the web build. Hosting providers pass
# their environment variables as build arguments.
ARG VITE_GOOGLE_MAPS_API_KEY=""
ARG VITE_GOOGLE_MAP_ID="DEMO_MAP_ID"
ARG VITE_OSM_TILE_URL=""
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_GOOGLE_MAP_ID=$VITE_GOOGLE_MAP_ID \
    VITE_OSM_TILE_URL=$VITE_OSM_TILE_URL
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=web /app/dist /app/dist
EXPOSE 4000
CMD ["node", "src/index.js"]
