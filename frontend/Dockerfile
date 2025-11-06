# --- Build de React ---
FROM node:20-alpine AS builder
WORKDIR /app

# Recibimos el argumento del build desde Cloud Build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Instalamos dependencias y construimos el proyecto
COPY package*.json ./
RUN npm ci
COPY . .

# El build tomará la variable REACT_APP_API_URL
RUN npm run build

# --- Nginx para servir estáticos + proxy /api ---
FROM nginx:alpine

# Nginx en Cloud Run debe escuchar en el puerto 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos compilados desde la etapa anterior
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx","-g","daemon off;"]
