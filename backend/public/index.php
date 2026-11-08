<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FichApp\Support\Env;
use FichApp\Support\Container;

// 1. Cargar variables de entorno
Env::load(__DIR__ . '/../.env');

// 2. Establecer zona horaria por defecto (Venezuela)
date_default_timezone_set((string)Env::get('TIMEZONE', 'America/Caracas'));

// 3. Respuesta JSON inicial
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'app' => 'FichApp API',
    'version' => '0.3',
    'status' => 'operational',
    'timezone' => date_default_timezone_get(),
    'timestamp' => date('c'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
