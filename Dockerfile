FROM node:20-slim

# Install Ghostscript and QPDF for high-performance PDF optimization
RUN apt-get update && \
    apt-get install -y --no-install-recommends ghostscript qpdf && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package specifications and install root dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build React admin dashboard into static directory
RUN cd admin-dashboard && npm install && CI=false npm run build && \
    mkdir -p ../pdf-compressor/frontend/admin && \
    cp -r build/* ../pdf-compressor/frontend/admin/ || true

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "pdf-compressor/backend/app.js"]
