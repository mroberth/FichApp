<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\Respuesta;
use App\DTOs\RegistrarJugadorDTO;
use App\DTOs\ActualizarJugadorDTO;
use App\DTOs\AsignarEquipoDTO;
use App\Middlewares\AuthMiddleware;
use App\Services\JugadorService;

/**
 * Controlador REST para la gestión de fichas deportivas de jugadores.
 * Endpoints bajo /api/v1/players
 */
class JugadorController
{
    private static ?JugadorService $jugadorService = null;

    public static function setService(?JugadorService $service): void
    {
        self::$jugadorService = $service;
    }

    private static function getService(): JugadorService
    {
        return self::$jugadorService ?? new JugadorService();
    }

    /**
     * GET /api/v1/players
     * Lista jugadores con soporte para filtros por categoría, equipo, término de búsqueda y paginación.
     */
    public static function listar(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $filtros = [
            'categoria_id' => $_GET['categoria_id'] ?? null,
            'equipo_id'    => $_GET['equipo_id'] ?? null,
            'estado'       => $_GET['estado'] ?? null,
            'busqueda'     => $_GET['busqueda'] ?? $_GET['q'] ?? null,
            'limite'       => isset($_GET['limite']) ? (int)$_GET['limite'] : 50,
            'offset'       => isset($_GET['offset']) ? (int)$_GET['offset'] : 0,
        ];

        $resultado = self::getService()->listar($academiaId, $filtros);

        Respuesta::exito($resultado, 200);
    }

    /**
     * GET /api/v1/players/{id}
     * Obtiene la ficha deportiva consolidada completa de un atleta.
     */
    public static function obtener(string $id): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $ficha = self::getService()->obtenerFicha($id, $academiaId);

        Respuesta::exito($ficha, 200);
    }

    /**
     * POST /api/v1/players
     * Registra integralmente a un jugador, su representante (nuevo o existente) y asignación a equipo.
     */
    public static function registrar(): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $dto = RegistrarJugadorDTO::desdeArray($datos);

        $ficha = self::getService()->registrarJugador($academiaId, $dto, $usuarioId);

        Respuesta::exito($ficha, 201);
    }

    /**
     * PATCH /api/v1/players/{id}
     * Actualiza los datos personales, médicos o de estado de un jugador.
     */
    public static function actualizar(string $id): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $dto = ActualizarJugadorDTO::desdeArray($datos);

        $fichaActualizada = self::getService()->actualizar($id, $academiaId, $dto, $usuarioId);

        Respuesta::exito($fichaActualizada, 200);
    }

    /**
     * DELETE /api/v1/players/{id}
     * Realiza el borrado lógico de un jugador en la academia.
     */
    public static function eliminar(string $id): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        self::getService()->eliminar($id, $academiaId, $usuarioId);

        Respuesta::exito([
            'mensaje' => 'Ficha deportiva del jugador dada de baja exitosamente.',
            'id'      => $id,
        ], 200);
    }

    /**
     * POST /api/v1/players/{id}/team
     * Asigna un jugador a un equipo deportivo en una temporada específica.
     */
    public static function asignarEquipo(string $id): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $datos['jugador_id'] = $id;

        $dto = AsignarEquipoDTO::desdeArray($datos);

        $ficha = self::getService()->asignarAEquipo($academiaId, $dto, $usuarioId);

        Respuesta::exito($ficha, 200);
    }

    /**
     * Lee y decodifica el cuerpo de la petición HTTP en formato JSON.
     *
     * @return array<string, mixed>
     * @throws ExcepcionApi
     */
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
