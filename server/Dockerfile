# Production Dockerfile for Team Asterix Backend
FROM node:24-alpine

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy backend source code
COPY src ./src

# Create volume directories
RUN mkdir -p /app/data /app/uploads

ENV PORT=5000
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data
ENV UPLOADS_DIR=/app/uploads

EXPOSE 5000

# Mountable persistent volumes for asterix.db and uploads
VOLUME ["/app/data", "/app/uploads"]

CMD ["node", "src/index.js"]
