# syntax=docker/dockerfile:1
# Stage 1: build static assets (no secrets in image; API URL from build-arg)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# Build-time API base URL (e.g. empty for same-origin or full URL)
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---
# Stage 2: nginx to serve static files
FROM nginx:1.25-alpine

RUN addgroup -g 1000 app && adduser -u 1000 -G app -D app

# Remove default config and use our own
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chown -R app:app /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && chown -R app:app /var/run

USER app

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
