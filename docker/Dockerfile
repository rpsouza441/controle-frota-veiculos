# Stage 1: Build the Vite frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the project and build frontend
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend, server and scripts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/db ./db

ENV NODE_ENV=production
ENV API_PORT=3333

EXPOSE 3333

# Start the Express API (which also serves the frontend from /dist)
CMD ["node", "server/index.js"]
