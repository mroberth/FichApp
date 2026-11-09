<?php

declare(strict_types=1);

use App\Core\Router;
use App\Core\Respuesta;
use App\Core\ContextoTenant;
use App\Middlewares\TenantMiddleware;
use App\Controllers\AuthController;

// Rutas base bajo prefijo /api/v1
Router::grupo('api/v1', function () {

    // Ping de salud
    Router::get('ping', function () {
        Respuesta::exito([
            'mensaje'    => 'pong',
            'tiempo'     => microtime(true),
            'fecha_hora' => date('c'),
        ]);
    });

    // Verificación de estado del sistema
    Router::get('estado', function () {
        Respuesta::exito([
            'aplicacion'   => 'FichApp API',
            'version'      => '0.3',
            'estado'       => 'operativo',
            'zona_horaria' => date_default_timezone_get(),
        ]);
    });

    // Prueba de ruta con parámetro dinámico {id}
    Router::get('prueba/{id}', function (string $id) {
        Respuesta::exito([
            'mensaje' => 'Parámetro capturado exitosamente',
            'id'      => $id,
        ]);
    });

    // Verificación de aislamiento multi-tenant
    Router::get('tenant/verificar', function () {
        TenantMiddleware::exigir();
        Respuesta::exito([
            'mensaje'     => 'Contexto de academia validado correctamente',
            'academia_id' => ContextoTenant::getAcademiaId(),
        ]);
    });

    // ---- Módulo de Autenticación y Sesiones ----
    Router::grupo('auth', function () {
        Router::post('login', [AuthController::class, 'login']);
        Router::get('me', [AuthController::class, 'me']);
        Router::post('logout', [AuthController::class, 'logout']);
    });
});
