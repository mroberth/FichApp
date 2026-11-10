<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * DTO para la sincronización en lote de asistencia offline.
 */
final class SincronizarAsistenciaDTO
{
    /**
     * @param array<array{
     *   id: string,
     *   equipo_id: string,
     *   fecha_sesion: string,
     *   lugar?: string|null,
     *   observaciones?: string|null
     * }> $sesiones
     * @param array<array{
     *   id: string,
     *   sesion_id: string,
     *   jugador_id: string,
     *   estado_asistencia: string,
     *   observaciones?: string|null
     * }> $registros
     */
    public function __construct(
        public readonly array $sesiones,
        public readonly array $registros
    ) {}

    public static function desdeArray(array $datos): self
    {
        $sesiones = $datos['sesiones'] ?? [];
        $registros = $datos['registros'] ?? [];

        if (!is_array($sesiones)) {
            throw ExcepcionApi::validacion('El campo "sesiones" debe ser un arreglo.');
        }

        if (!is_array($registros)) {
            throw ExcepcionApi::validacion('El campo "registros" debe ser un arreglo.');
        }

        // Validaciones básicas de esquema
        foreach ($sesiones as $idx => $s) {
            if (empty($s['id']) || empty($s['equipo_id']) || empty($s['fecha_sesion'])) {
                throw ExcepcionApi::validacion("La sesión en el índice {$idx} debe contener 'id', 'equipo_id' y 'fecha_sesion'.");
            }
        }

        foreach ($registros as $idx => $r) {
            if (empty($r['id']) || empty($r['sesion_id']) || empty($r['jugador_id']) || empty($r['estado_asistencia'])) {
                throw ExcepcionApi::validacion("El registro de asistencia en el índice {$idx} debe contener 'id', 'sesion_id', 'jugador_id' y 'estado_asistencia'.");
            }
            if (!in_array($r['estado_asistencia'], ['presente', 'ausente', 'justificado'], true)) {
                throw ExcepcionApi::validacion("Estado de asistencia no válido en el registro {$idx}: '{$r['estado_asistencia']}'.");
            }
        }

        return new self($sesiones, $registros);
    }
}
