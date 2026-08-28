FROM php:8.2-apache

# 1. Dependencias del sistema
RUN apt-get update && apt-get install -y libpq-dev unzip \
    && docker-php-ext-install pdo pdo_pgsql

# 2. TRAER COMPOSER (Forma elegante)
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# 3. Código y dependencias
WORKDIR /var/www/html
COPY . .
RUN composer install --no-dev --optimize-autoloader

# 4. Puertos y permisos
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf
RUN chown -R www-data:www-data /var/www/html

EXPOSE ${PORT}