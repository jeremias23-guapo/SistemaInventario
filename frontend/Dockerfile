# --- Build de React ---
FROM node:20-alpine AS builder
WORKDIR /app

# Recibimos el argumento del build
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

COPY package*.json ./
RUN npm ci
COPY . .

# El build tomará la variable REACT_APP_BACKEND_URL
RUN npm run build

# --- Nginx para servir estáticos + proxy /api ---
FROM nginx:alpine

# Nginx en Cloud Run debe escuchar 8080 (no 80)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos compilados del build
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx","-g","daemon off;"]
