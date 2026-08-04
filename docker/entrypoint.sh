#!/bin/sh
set -e

cd /var/www/html

PORT="${PORT:-8080}"

# Resolve the Render PORT into the nginx config
sed "s|__PORT__|${PORT}|g" /var/www/html/docker/nginx.conf > /etc/nginx/http.d/default.conf

# Clear any stale cached config so real env vars take effect
php artisan optimize:clear 2>/dev/null || true

# Generate a valid app key if missing or malformed. Render's "sync: false"
# APP_KEY is a plain secret (not base64:...), which Laravel rejects.
if ! php -r 'exit((getenv("APP_KEY") && str_starts_with(getenv("APP_KEY"), "base64:")) ? 0 : 1);'; then
    echo "APP_KEY missing/invalid — generating a valid key."
    unset APP_KEY
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

# Run migrations (bounded retries so a DB hiccup can't hang boot).
# The web stack is already serving health checks above, so a failure
# here just logs and lets the container come up anyway.
MIGRATE_TRIES=12
MIGRATE_TRY=0
until php artisan migrate --force; do
    MIGRATE_TRY=$((MIGRATE_TRY + 1))
    if [ "$MIGRATE_TRY" -ge "$MIGRATE_TRIES" ]; then
        echo "Migrations failed after $MIGRATE_TRIES attempts — continuing anyway."
        break
    fi
    echo "DB not ready yet — retrying in 5s... ($MIGRATE_TRY/$MIGRATE_TRIES)"
    sleep 5
done

# Seed when the database is empty (fresh Render Postgres on first boot) or
# when SEED_ON_START=true forces it. Once data exists this is skipped, so
# cold starts stay fast.
if [ "${SEED_ON_START:-false}" = "true" ] || ! php artisan tinker --execute='exit(\App\Models\User::query()->exists() ? 0 : 1);' 2>/dev/null; then
    echo "Seeding database (fresh database or forced)..."
    php artisan db:seed --force --no-interaction \
        || echo "Seeding failed — check the DB connection."
fi

echo "==> Startup complete. App is live."

# Keep the container alive by waiting on supervisord
wait $SUPERVISOR_PID
