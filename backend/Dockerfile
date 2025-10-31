FROM node:20

# Toolchain para dependencias nativas (bcrypt, etc.)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps primero para cache eficiente
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el resto del código
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
