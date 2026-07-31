FROM php:8.4-fpm

# System dependencies (incl. nginx, supervisor, build deps for PHP extensions)
RUN apk add --no-cache \
        nginx \
        supervisor \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        icu-dev \
        libzip-dev \
        oniguruma-dev \
        libpq \
        postgresql-dev \
        nodejs \
        npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd intl zip pdo_mysql pdo_pgsql opcache

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy app and install dependencies / build assets
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && npm ci \
    && npm run build \
    && rm -rf node_modules

# Ensure writable dirs for www-data
RUN chown -R www-data:www-data storage bootstrap/cache

# Runtime configs (entrypoint resolves $PORT into nginx config)
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint

# Create storage symlink target
RUN mkdir -p /var/www/html/storage/app/public

EXPOSE 8080

CMD ["/bin/sh", "/usr/local/bin/docker-entrypoint"]
