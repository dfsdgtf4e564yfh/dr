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

echo ">>> Starting daphne on port 8000..."
export SERVER_STARTED=true
exec daphne -b 0.0.0.0 -p 8000 \
    --access-log - \
    --verbosity 2 \
    config.asgi:application
