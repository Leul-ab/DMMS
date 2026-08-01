#!/bin/sh
set -e

cd /var/www/html

PORT="${PORT:-8080}"

# Resolve the Render PORT into the nginx config
sed "s|__PORT__|${PORT}|g" /var/www/html/docker/nginx.conf > /etc/nginx/http.d/default.conf

# Generate app key if not provided via env
if [ -z "${APP_KEY}" ]; then
    php artisan key:generate --force
fi

# Wait for DB, then migrate
until php artisan migrate --force; do
    echo "Database not ready - retrying in 5s..."
    sleep 5
done

# Seed only on first boot (seeders are idempotent)
php artisan db:seed --force --no-interaction

# Storage symlink for uploaded files (best-effort; filesystem is ephemeral)
php artisan storage:link 2>/dev/null || true

# Clear cached config so env vars take effect
php artisan optimize:clear 2>/dev/null || true

exec supervisord -c /etc/supervisord.conf
