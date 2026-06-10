#!/bin/bash
set -e

echo ">>> Ensuring database file exists..."
mkdir -p /app/data
if [ ! -f /app/data/db.sqlite3 ]; then
    touch /app/data/db.sqlite3
    echo ">>> Created empty db.sqlite3"
fi

echo ">>> Migrating..."
python manage.py migrate --noinput

echo ">>> Initializing data..."
python manage.py init_data 2>/dev/null || echo "init_data skipped or already done"

echo ">>> Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo ">>> Starting gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --timeout 120 \
    --max-requests 500 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --log-level info
