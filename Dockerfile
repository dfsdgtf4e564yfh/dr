FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /app/dist /frontend/dist
COPY --from=frontend-builder /app/portal /frontend/portal

RUN mkdir -p /app/taheri && chmod +x /app/start.sh

EXPOSE 8000

ENV DATA_DIR=/app/taheri
ENV DEBUG=False
ENV ALLOWED_HOSTS=*
ENV CORS_ALLOW_ALL_ORIGINS=False
ENV CORS_ALLOWED_ORIGINS=
ENV CSRF_TRUSTED_ORIGINS=
ENV SECURE_SSL_REDIRECT=True

CMD ["/app/start.sh"]
