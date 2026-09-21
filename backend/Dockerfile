# Cloud Run image for the TaskPanda AI service.
# This container holds only the Gemini proxy — PDF uploads go straight from the
# browser to Firebase Storage, so there is no filesystem state to preserve.

FROM node:22-slim

ENV NODE_ENV=production

WORKDIR /app

# Copy manifests first so dependency install is cached across code changes.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Cloud Run injects PORT; the server already honours it and defaults to 5001.
EXPOSE 8080
ENV PORT=8080

CMD ["node", "src/server.js"]
