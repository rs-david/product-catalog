# 1. Usamos la imagen base
FROM php:8.2-apache

# 2. Instalamos dependencias del sistema y herramientas para Composer
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# 3. INSTALAMOS COMPOSER dentro del contenedor
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 4. Establecemos el directorio de trabajo
WORKDIR /var/www/html

# 5. Copiamos los archivos de la app
COPY . /var/www/html/

# 6. EJECUTAMOS COMPOSER para generar la carpeta /vendor
# Usamos --no-dev para producción y --optimize-autoloader para velocidad
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 7. Ajuste de puertos para Render
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# 8. Permisos (Importante para que Apache pueda leer vendor)
RUN chown -R www-data:www-data /var/www/html

EXPOSE ${PORT}