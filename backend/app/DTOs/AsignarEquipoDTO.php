<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * DTO para la asignación de un jugador a un equipo deportivo en una temporada.
 * Inmutable y fuertemente tipado para PHP 8.5+.
 */
final readonly class AsignarEquipoDTO
{
    public function __construct(
        public string $jugadorId,
        public string $equipoId,
        public string $temporada = '2026',
        public ?int $numeroCamiseta = null,
        public ?string $posicion = null
    ) {}

    /**
     * @param array<string, mixed> $datos
     * @throws ExcepcionApi
     */
    public static function desdeArray(array $datos): self
    {
        $errores = [];

        $jugadorId = $datos['jugador_id'] ?? null;
        if ($jugadorId === null || trim((string)$jugadorId) === '') {
            $errores['jugador_id'] = 'El ID del jugador es obligatorio.';
        }

        $equipoId = $datos['equipo_id'] ?? null;
        if ($equipoId === null || trim((string)$equipoId) === '') {
            $errores['equipo_id'] = 'El ID del equipo es obligatorio.';
        }

        $temporada = !empty($datos['temporada']) ? trim((string)$datos['temporada']) : date('Y');

        $numeroCamiseta = null;
        if (isset($datos['numero_camiseta']) && $datos['numero_camiseta'] !== '') {
            $numeroCamiseta = (int)$datos['numero_camiseta'];
            if ($numeroCamiseta < 0 || $numeroCamiseta > 99) {
                $errores['numero_camiseta'] = 'El número de camiseta debe estar entre 0 y 99.';
            }
        }

        if (!empty($errores)) {
            throw ExcepcionApi::validacion('Datos de asignación a equipo inválidos o incompletos.', $errores);
        }

        return new self(
            jugadorId: trim((string)$jugadorId),
            equipoId: trim((string)$equipoId),
            temporada: $temporada,
            numeroCamiseta: $numeroCamiseta,
            posicion: !empty($datos['posicion']) ? trim((string)$datos['posicion']) : null
        );
    }
}
