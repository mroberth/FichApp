<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Respuesta;
use App\Core\Router;
use App\Middlewares\CorsMiddleware;

// 1. Cargar variables de entorno
Env::load(__DIR__ . '/../.env');

// 2. Zona horaria de Venezuela por defecto
date_default_timezone_set((string)Env::get('TIMEZONE', 'America/Caracas'));

// 3. Manejador global de excepciones con contrato estándar JSON
set_exception_handler(function (\Throwable $e) {
    Respuesta::error($e);
});

// 4. Manejo de cabeceras CORS y pre-flight (OPTIONS)
CorsMiddleware::manejar();

// 5. Cargar definición de rutas de la API
require_once __DIR__ . '/../app/routes/api.php';

// 6. Despachar la solicitud entrante
Router::despachar();
