<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\Respuesta;
use App\DTOs\SincronizarAsistenciaDTO;
use App\Middlewares\AuthMiddleware;
use App\Services\AsistenciaService;

/**
 * Controlador REST para la gestión y sincronización de asistencia técnica.
 * Endpoints bajo /api/v1/attendance
 */
class AsistenciaController
{
    private static ?AsistenciaService $asistenciaService = null;

    public static function setService(?AsistenciaService $service): void
    {
        self::$asistenciaService = $service;
    }

    private static function getService(): AsistenciaService
    {
        return self::$asistenciaService ?? new AsistenciaService();
    }

    /**
     * POST /api/v1/attendance/sync
     * Sincronización en lote idempotente de sesiones y asistencias tomadas offline.
     */
    public static function sincronizar(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $cuerpo = self::obtenerCuerpoJson();
        $dto = SincronizarAsistenciaDTO::desdeArray($cuerpo);

        $resultado = self::getService()->sincronizarLote($academiaId, $usuarioId, $dto);

        Respuesta::exito($resultado, 200);
    }

    /**
     * GET /api/v1/attendance/sessions
     * Lista las sesiones de entrenamiento con sus estadísticas de asistencia.
     */
    public static function listarSesiones(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $equipoId = $_GET['equipo_id'] ?? null;
        $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 50;

        $sesiones = self::getService()->listarHistorial($academiaId, $equipoId, $limite);

        Respuesta::exito($sesiones, 200);
    }

    /**
     * Extrae el payload JSON del cuerpo HTTP de la petición.
     */
    private static function obtenerCuerpoJson(): array
    {
        $entrada = file_get_contents('php://input');
        if (!$entrada || trim($entrada) === '') {
            return [];
        }

        $datos = json_decode($entrada, true);
        if (!is_array($datos)) {
            throw ExcepcionApi::validacion('El cuerpo de la petición debe ser un objeto JSON válido.');
        }

        return $datos;
    }
}
