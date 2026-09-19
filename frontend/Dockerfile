# ==============================================================================
# Multi-stage Dockerfile for NASA Earth System Trend Detective Frontend (React 19)
# Context: Monorepo Root (.)
# ==============================================================================

# Stage 1: Build Frontend Assets with Monorepo Workspaces
FROM node:22-alpine AS build
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY frontend/package.json ./frontend/

# Install workspace dependencies
RUN npm install

# Copy frontend source code
COPY frontend ./frontend

# Build frontend production bundle
RUN npm run build --workspace=frontend

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine AS final

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
