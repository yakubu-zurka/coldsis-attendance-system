# Use Node.js LTS as the base image
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Final stage
FROM node:20-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose the port from env or 5001
EXPOSE 5001

CMD ["node", "server.js"]
