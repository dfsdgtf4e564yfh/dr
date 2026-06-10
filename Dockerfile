FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY --from=frontend-builder /app/dist /frontend/dist

RUN mkdir -p backups

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV ALLOWED_HOSTS=*
ENV CORS_ALLOW_ALL_ORIGINS=True
ENV CSRF_TRUSTED_ORIGINS=
ENV DJANGO_SECRET_KEY=change-this-secret-key-in-production
ENV DEBUG=False

CMD ["sh", "-c", "python manage.py migrate && python manage.py init_data && python manage.py seed_patients && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 1"]
