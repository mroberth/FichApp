<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * DTO para la actualización de datos de un jugador.
 * Inmutable y fuertemente tipado para PHP 8.5+.
 */
final readonly class ActualizarJugadorDTO
{
    /**
     * @param array<string, mixed>|null $fichaMedica
     */
    public function __construct(
        public ?string $nombres = null,
        public ?string $apellidos = null,
        public ?string $fechaNacimiento = null,
        public ?string $cedula = null,
        public ?string $sexo = null,
        public ?array $fichaMedica = null,
        public ?string $estado = null
    ) {}

    /**
     * @param array<string, mixed> $datos
     * @throws ExcepcionApi
     */
    public static function desdeArray(array $datos): self
    {
        $errores = [];

        $sexo = !empty($datos['sexo']) ? strtoupper(trim((string)$datos['sexo'])) : null;
        if ($sexo !== null && !in_array($sexo, ['M', 'F'], true)) {
            $errores['sexo'] = 'El sexo debe ser "M" o "F".';
        }

        $fechaNacimiento = !empty($datos['fecha_nacimiento']) ? trim((string)$datos['fecha_nacimiento']) : null;
        if ($fechaNacimiento !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaNacimiento)) {
            $errores['fecha_nacimiento'] = 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.';
        }

        $estado = !empty($datos['estado']) ? trim((string)$datos['estado']) : null;
        if ($estado !== null && !in_array($estado, ['activo', 'inactivo', 'retirado'], true)) {
            $errores['estado'] = 'El estado debe ser "activo", "inactivo" o "retirado".';
        }

        $fichaMedica = null;
        if (isset($datos['ficha_medica'])) {
            if (is_array($datos['ficha_medica'])) {
                $fichaMedica = $datos['ficha_medica'];
            } elseif (is_string($datos['ficha_medica'])) {
                $dec = json_decode($datos['ficha_medica'], true);
                if (is_array($dec)) {
                    $fichaMedica = $dec;
                }
            }
        }

        if (!empty($errores)) {
            throw ExcepcionApi::validacion('Datos de actualización de jugador inválidos.', $errores);
        }

        return new self(
            nombres: isset($datos['nombres']) ? trim((string)$datos['nombres']) : null,
            apellidos: isset($datos['apellidos']) ? trim((string)$datos['apellidos']) : null,
            fechaNacimiento: $fechaNacimiento,
            cedula: isset($datos['cedula']) && trim((string)$datos['cedula']) !== '' ? strtoupper(trim((string)$datos['cedula'])) : null,
            sexo: $sexo,
            fichaMedica: $fichaMedica,
            estado: $estado
        );
    }

    /**
     * Retorna únicamente los campos que no son null como array asociativo.
     *
     * @return array<string, mixed>
     */
    public function aArrayFiltrado(): array
    {
        $campos = [];
        if ($this->nombres !== null) {
            $campos['nombres'] = $this->nombres;
        }
        if ($this->apellidos !== null) {
            $campos['apellidos'] = $this->apellidos;
        }
        if ($this->fechaNacimiento !== null) {
            $campos['fecha_nacimiento'] = $this->fechaNacimiento;
        }
        if ($this->cedula !== null) {
            $campos['cedula'] = $this->cedula;
        }
        if ($this->sexo !== null) {
            $campos['sexo'] = $this->sexo;
        }
        if ($this->fichaMedica !== null) {
            $campos['ficha_medica'] = $this->fichaMedica;
        }
        if ($this->estado !== null) {
            $campos['estado'] = $this->estado;
        }
        return $campos;
    }
}
