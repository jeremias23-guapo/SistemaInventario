# --- Build de React ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Nginx para servir estáticos + proxy /api ---
FROM nginx:alpine
# Nginx en Cloud Run debe escuchar 8080 (no 80)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx","-g","daemon off;"]
