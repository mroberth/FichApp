<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Respuesta;
use App\Core\ExcepcionApi;

// 1. Cargar variables de entorno
Env::load(__DIR__ . '/../.env');

// 2. Zona horaria de Venezuela por defecto
date_default_timezone_set((string)Env::get('TIMEZONE', 'America/Caracas'));

// 3. Manejador global de errores con contrato estándar
set_exception_handler(function (\Throwable $e) {
    Respuesta::error($e);
});

// 4. Salida inicial de verificación operacional
Respuesta::exito([
    'aplicacion' => 'FichApp API',
    'version' => '0.3',
    'estado' => 'operativo',
    'zona_horaria' => date_default_timezone_get(),
    'fecha_hora' => date('c'),
]);
