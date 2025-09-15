# Use Node.js LTS (18) as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy all source code
COPY . .

# Build step (if using TypeScript)
RUN npm run build || echo "no build step"

# Expose the agent port
EXPOSE 8081

# Start the agent
CMD ["node", "agent.js", "start"]
