FROM node:20-slim

# Install Ghostscript and QPDF for high-performance PDF optimization
RUN apt-get update && \
    apt-get install -y --no-install-recommends ghostscript qpdf && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend dependencies first for Docker layer caching
COPY pdf-compressor/backend/package*.json ./pdf-compressor/backend/

# Install backend production dependencies
RUN cd pdf-compressor/backend && npm install --omit=dev

# Symlink backend node_modules to root so require() resolves from any directory
RUN ln -s /app/pdf-compressor/backend/node_modules /app/node_modules

# Copy application files
COPY . .

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "pdf-compressor/backend/app.js"]
