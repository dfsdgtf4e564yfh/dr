#!/bin/bash
set -e

DATA_DIR="${DATA_DIR:-/app/taheri}"
echo ">>> Ensuring required directories exist under ${DATA_DIR}..."
mkdir -p "$DATA_DIR"/{data,media,backups,static}
if [ ! -f "$DATA_DIR/data/db.sqlite3" ]; then
    touch "$DATA_DIR/data/db.sqlite3"
    echo ">>> Created empty db.sqlite3 at ${DATA_DIR}/data/"
fi

echo ">>> Migrating..."
python manage.py migrate --noinput

echo ">>> Initializing data..."
python manage.py init_data || echo "init_data skipped or already done"

echo ">>> Collecting static files..."
python manage.py collectstatic --noinput || true

echo ">>> Starting daphne on port 8000..."
export SERVER_STARTED=true
exec daphne -b 0.0.0.0 -p 8000 \
    --access-log - \
    --verbosity 2 \
    config.asgi:application
