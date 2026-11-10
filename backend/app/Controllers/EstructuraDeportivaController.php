<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\Respuesta;
use App\Middlewares\AuthMiddleware;
use App\Services\EstructuraDeportivaService;

/**
 * Controlador REST para la estructura deportiva: categorías, planteles de equipos
 * y asignación técnica de entrenadores.
 */
class EstructuraDeportivaController
{
    private static ?EstructuraDeportivaService $servicio = null;

    public static function setService(?EstructuraDeportivaService $servicio): void
    {
        self::$servicio = $servicio;
    }

    private static function getService(): EstructuraDeportivaService
    {
        return self::$servicio ?? new EstructuraDeportivaService();
    }

    /**
     * GET /api/v1/categories
     * Lista las categorías deportivas de la academia.
     */
    public static function listarCategorias(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $estado = $_GET['estado'] ?? null;
        $categorias = self::getService()->listarCategorias($academiaId, $estado);

        Respuesta::exito($categorias, 200);
    }

    /**
     * POST /api/v1/categories
     * Registra una nueva categoría deportiva en la academia.
     */
    public static function crearCategoria(): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $categoria = self::getService()->crearCategoria($academiaId, $datos, $usuarioId);

        Respuesta::exito($categoria, 201);
    }

    /**
     * GET /api/v1/teams
     * Lista los equipos deportivos con filtro opcional por categoría.
     */
    public static function listarEquipos(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $categoriaId = $_GET['categoria_id'] ?? null;
        $estado = $_GET['estado'] ?? null;

        $equipos = self::getService()->listarEquipos($academiaId, $categoriaId, $estado);

        Respuesta::exito($equipos, 200);
    }

    /**
     * POST /api/v1/teams
     * Crea un nuevo equipo deportivo asociado a una categoría.
     */
    public static function crearEquipo(): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $equipo = self::getService()->crearEquipo($academiaId, $datos, $usuarioId);

        Respuesta::exito($equipo, 201);
    }

    /**
     * GET /api/v1/teams/{id}/coaches
     * Lista los entrenadores activos asignados a un equipo deportivo.
     */
    public static function obtenerEntrenadores(string $id): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $entrenadores = self::getService()->obtenerEntrenadoresDeEquipo($id, $academiaId);

        Respuesta::exito($entrenadores, 200);
    }

    /**
     * POST /api/v1/teams/{id}/coaches
     * Asigna un entrenador a un equipo deportivo especificando su rol técnico.
     */
    public static function asignarEntrenador(string $id): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $entrenadorId = trim((string)($datos['entrenador_id'] ?? ''));
        $rol = trim((string)($datos['rol'] ?? 'principal'));

        if ($entrenadorId === '') {
            throw ExcepcionApi::validacion('El ID del entrenador es obligatorio.');
        }

        $asignacion = self::getService()->asignarEntrenador(
            $academiaId,
            $id,
            $entrenadorId,
            $rol,
            $usuarioId
        );

        Respuesta::exito($asignacion, 201);
    }

    private static function obtenerCuerpoJson(): array
    {
        $cuerpo = file_get_contents('php://input');
        $datos = json_decode($cuerpo ?: '{}', true);

        if (!is_array($datos)) {
            throw ExcepcionApi::jsonInvalido('El cuerpo de la solicitud debe ser un objeto JSON válido.');
        }

        return $datos;
    }
}
