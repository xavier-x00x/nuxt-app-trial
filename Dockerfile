# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else npm install; fi

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod; else npm install --only=production; fi

# Copy built application from builder stage
COPY --from=builder /app/.output /app/.output

# Expose port
EXPOSE 3000

# Set environment
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["node", ".output/server/index.mjs"]
