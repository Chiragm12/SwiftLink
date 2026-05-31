FROM node:20-alpine

WORKDIR /app

# Copy package files first — Docker caches this layer
# Only re-runs npm install if package.json changes
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]