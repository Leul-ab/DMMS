#!/bin/sh
set -e

cd /var/www/html

PORT="${PORT:-8080}"

# Resolve the Render PORT into the nginx config
sed "s|__PORT__|${PORT}|g" /var/www/html/docker/nginx.conf > /etc/nginx/http.d/default.conf

# Clear any stale cached config so real env vars take effect
php artisan optimize:clear 2>/dev/null || true

# Generate app key if not provided via env
if [ -z "${APP_KEY}" ]; then
    php artisan key:generate --force
fi

# Storage symlink for uploaded files (best-effort; ephemeral filesystem)
php artisan storage:link 2>/dev/null || true

##################################################
# Start supervisord (nginx + php-fpm) in the
# background so the port binds IMMEDIATELY.
# Render times out if the port isn't bound fast.
##################################################
supervisord -c /etc/supervisord.conf &
SUPERVISOR_PID=$!

# Give nginx a moment to start before running artisan
sleep 3

# Run migrations (retries until DB is reachable)
until php artisan migrate --force; do
    echo "DB not ready yet — retrying in 5s..."
    sleep 5
done

echo "==> Startup complete. App is live."

# Keep the container alive by waiting on supervisord
wait $SUPERVISOR_PID
