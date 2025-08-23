# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY packages/backend/ ./packages/backend/

# Build the application
WORKDIR /app/packages/backend
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]