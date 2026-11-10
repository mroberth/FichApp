<?php

declare(strict_types=1);

use App\Core\Router;
use App\Core\Respuesta;
use App\Core\ContextoTenant;
use App\Middlewares\TenantMiddleware;
use App\Controllers\AuthController;
use App\Controllers\JugadorController;
use App\Controllers\EstructuraDeportivaController;
use App\Controllers\FamiliaController;

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

    // ---- Módulo Deportivo: Categorías ----
    Router::grupo('categories', function () {
        Router::get('', [EstructuraDeportivaController::class, 'listarCategorias']);
        Router::post('', [EstructuraDeportivaController::class, 'crearCategoria']);
    });

    // ---- Módulo Deportivo: Equipos ----
    Router::grupo('teams', function () {
        Router::get('', [EstructuraDeportivaController::class, 'listarEquipos']);
        Router::post('', [EstructuraDeportivaController::class, 'crearEquipo']);
        Router::get('{id}/coaches', [EstructuraDeportivaController::class, 'obtenerEntrenadores']);
        Router::post('{id}/coaches', [EstructuraDeportivaController::class, 'asignarEntrenador']);
    });

    // ---- Módulo Deportivo: Jugadores y Fichas Deportivas ----
    Router::grupo('players', function () {
        Router::get('', [JugadorController::class, 'listar']);
        Router::post('', [JugadorController::class, 'registrar']);
        Router::get('{id}', [JugadorController::class, 'obtener']);
        Router::patch('{id}', [JugadorController::class, 'actualizar']);
        Router::delete('{id}', [JugadorController::class, 'eliminar']);
        Router::post('{id}/team', [JugadorController::class, 'asignarEquipo']);
    });

    // ---- Módulo Familiar: Representantes y Grupos Familiares ----
    Router::grupo('representatives', function () {
        Router::get('', [FamiliaController::class, 'buscar']);
        Router::post('', [FamiliaController::class, 'crear']);
        Router::get('{id}/family', [FamiliaController::class, 'obtenerGrupoFamiliar']);
        Router::post('{id}/link-player', [FamiliaController::class, 'vincularHijo']);
    });
});
