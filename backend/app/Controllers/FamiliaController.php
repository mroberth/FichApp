<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\Respuesta;
use App\DTOs\CrearRepresentanteDTO;
use App\Middlewares\AuthMiddleware;
use App\Services\FamiliaService;

/**
 * Controlador REST para el padrón familiar y tutela de representantes.
 * Endpoints bajo /api/v1/representatives
 */
class FamiliaController
{
    private static ?FamiliaService $servicio = null;

    public static function setService(?FamiliaService $servicio): void
    {
        self::$servicio = $servicio;
    }

    private static function getService(): FamiliaService
    {
        return self::$servicio ?? new FamiliaService();
    }

    /**
     * GET /api/v1/representatives
     * Busca representantes por coincidencia en nombres, apellidos, cédula o teléfono.
     */
    public static function buscar(): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $termino = trim((string)($_GET['q'] ?? $_GET['busqueda'] ?? ''));
        $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 20;

        $representantes = self::getService()->buscar($academiaId, $termino, $limite);

        Respuesta::exito($representantes, 200);
    }

    /**
     * POST /api/v1/representatives
     * Registra un nuevo representante en el padrón familiar de la academia.
     */
    public static function crear(): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $dto = CrearRepresentanteDTO::desdeArray($datos);

        $representante = self::getService()->crearRepresentante($academiaId, $dto, $usuarioId);

        Respuesta::exito($representante, 201);
    }

    /**
     * GET /api/v1/representatives/{id}/family
     * Consulta el grupo familiar consolidado: datos del representante y todos sus hijos/atletas asociados.
     */
    public static function obtenerGrupoFamiliar(string $id): void
    {
        AuthMiddleware::manejar();
        $academiaId = ContextoTenant::getAcademiaId();

        $grupo = self::getService()->obtenerGrupoFamiliar($id, $academiaId);

        Respuesta::exito($grupo, 200);
    }

    /**
     * POST /api/v1/representatives/{id}/link-player
     * Vincula un jugador existente con el representante especificado.
     */
    public static function vincularHijo(string $id): void
    {
        AuthMiddleware::exigirRol('administrador', 'superadmin');
        $academiaId = ContextoTenant::getAcademiaId();
        $usuarioId = Auth::id();

        $datos = self::obtenerCuerpoJson();
        $jugadorId = trim((string)($datos['jugador_id'] ?? ''));
        $tipoRelacion = trim((string)($datos['tipo_relacion'] ?? 'representante_legal'));
        $esContactoPrincipal = (bool)($datos['es_contacto_principal'] ?? false);

        if ($jugadorId === '') {
            throw ExcepcionApi::validacion('El ID del jugador es obligatorio.');
        }

        $grupo = self::getService()->vincularHijo(
            $academiaId,
            $id,
            $jugadorId,
            $tipoRelacion,
            $esContactoPrincipal,
            $usuarioId
        );

        Respuesta::exito($grupo, 200);
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
