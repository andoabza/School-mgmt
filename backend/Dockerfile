FROM node:23-alpine3.19

WORKDIR /app

# Install dependencies first for caching
COPY src/package*.json ./
RUN npm install --omit=dev

# Copy app source into /app/src
COPY src/ ./src

# Security hardening
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "src/index.js"]