FROM node:20-slim

# Install Ghostscript and QPDF for high-performance PDF optimization
RUN apt-get update && \
    apt-get install -y --no-install-recommends ghostscript qpdf && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package specifications and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY . .

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "pdf-compressor/backend/app.js"]
