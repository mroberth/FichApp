<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * DTO para la creación y registro de representantes en el padrón familiar.
 * Inmutable y fuertemente tipado para PHP 8.5+.
 */
final readonly class CrearRepresentanteDTO
{
    public function __construct(
        public string $nombres,
        public string $apellidos,
        public string $telefono,
        public ?string $cedula = null,
        public ?string $correo = null,
        public ?string $direccion = null
    ) {}

    /**
     * @param array<string, mixed> $datos
     * @throws ExcepcionApi
     */
    public static function desdeArray(array $datos): self
    {
        $errores = [];

        $nombres = $datos['nombres'] ?? null;
        if ($nombres === null || trim((string)$nombres) === '') {
            $errores['nombres'] = 'Los nombres del representante son obligatorios.';
        }

        $apellidos = $datos['apellidos'] ?? null;
        if ($apellidos === null || trim((string)$apellidos) === '') {
            $errores['apellidos'] = 'Los apellidos del representante son obligatorios.';
        }

        $telefono = $datos['telefono'] ?? null;
        if ($telefono === null || trim((string)$telefono) === '') {
            $errores['telefono'] = 'El teléfono de contacto del representante es obligatorio.';
        }

        $correo = $datos['correo'] ?? null;
        if ($correo !== null && trim((string)$correo) !== '' && !filter_var(trim((string)$correo), FILTER_VALIDATE_EMAIL)) {
            $errores['correo'] = 'El formato del correo electrónico no es válido.';
        }

        if (!empty($errores)) {
            throw ExcepcionApi::validacion('Datos del representante inválidos o incompletos.', $errores);
        }

        return new self(
            nombres: trim((string)$nombres),
            apellidos: trim((string)$apellidos),
            telefono: trim((string)$telefono),
            cedula: !empty($datos['cedula']) ? strtoupper(trim((string)$datos['cedula'])) : null,
            correo: !empty($correo) ? mb_strtolower(trim((string)$correo)) : null,
            direccion: !empty($datos['direccion']) ? trim((string)$datos['direccion']) : null
        );
    }
}
