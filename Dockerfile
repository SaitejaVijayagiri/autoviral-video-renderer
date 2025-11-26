# Use Node.js LTS
FROM node:20-slim

# Install FFmpeg and basic dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including tsx for running TypeScript)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application using tsx to run TypeScript directly
CMD ["npx", "tsx", "src/server.ts"]
