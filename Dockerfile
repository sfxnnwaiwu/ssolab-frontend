# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@10.28.2 && \
    pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage - Serve with nginx
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/sso-test-frontend/browser /usr/share/nginx/html

# Create non-root user
RUN adduser -D -u 1001 -g 'www' www && \
    chown -R www:www /var/cache/nginx && \
    chown -R www:www /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R www:www /var/run/nginx.pid

# Switch to non-root user
USER www

# Expose port (Render default)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
