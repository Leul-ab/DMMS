FROM php:8.4-fpm-alpine

# Install system packages and PHP extensions
RUN apk add --no-cache \
    nginx \
    supervisor \
    nodejs \
    npm \
    git \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    libpq \
    postgresql-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        gd \
        intl \
        zip \
        pdo_mysql \
        pdo_pgsql \
        opcache

WORKDIR /var/www/html

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

##################################################
# Install PHP dependencies first (Docker cache)
##################################################
COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    --no-scripts

##################################################
# Install Node dependencies first (Docker cache)
##################################################
COPY package*.json ./

RUN npm ci

##################################################
# Copy application
##################################################
COPY . .

##################################################
# Build frontend assets
##################################################
RUN npm run build \
    && rm -rf node_modules \
    && npm cache clean --force

##################################################
# Finish Composer
##################################################
RUN composer dump-autoload --optimize

##################################################
# Permissions
##################################################
RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    storage/app/public \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

##################################################
# Copy Docker configuration
##################################################
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint

RUN chmod +x /usr/local/bin/docker-entrypoint

EXPOSE 8080

CMD ["/bin/sh", "/usr/local/bin/docker-entrypoint"]