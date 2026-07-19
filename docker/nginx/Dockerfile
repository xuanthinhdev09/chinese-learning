# Multi-stage build: Frontend → Nginx
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build


# Production Nginx stage
FROM nginx:alpine

# Copy frontend build from builder stage
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certificates (if needed later)
RUN mkdir -p /etc/nginx/ssl

# Expose ports
EXPOSE 80 443

# Default nginx command
CMD ["nginx", "-g", "daemon off;"]
