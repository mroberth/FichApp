<?php

declare(strict_types=1);

namespace App\Middlewares;

final class CorsMiddleware
{
    public static function manejar(): void
    {
        $origen = $_SERVER['HTTP_ORIGIN'] ?? '*';

        if (!headers_sent()) {
            header("Access-Control-Allow-Origin: {$origen}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Idempotency-Key, X-Academia-Id');
            header('Access-Control-Max-Age: 86400');
        }

        // Si es solicitud pre-flight de CORS (OPTIONS), responder inmediatamente y salir
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
