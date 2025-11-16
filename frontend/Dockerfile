FROM node:18-alpine

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies (cache this layer separately)
RUN npm install --legacy-peer-deps

# Copy application code (this layer changes more frequently)
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

