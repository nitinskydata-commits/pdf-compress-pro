# Use a Node.js base image
FROM node:20-slim

# Install Ghostscript and QPDF (The magic for PDF compression)
RUN apt-get update && \
    apt-get install -y ghostscript qpdf && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "app.js"]
