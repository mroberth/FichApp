<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * Objeto de Transferencia de Datos (DTO) para la autenticación de usuarios.
 * Inmutable y fuertemente tipado para PHP 8.5+.
 */
final readonly class LoginDTO
{
    public function __construct(
        public string $identificadorAcceso,
        public string $contrasena,
        public ?string $academiaId = null
    ) {}

    /**
     * Construye y valida el DTO a partir de un arreglo de datos de la solicitud.
     *
     * @param array<string, mixed> $datos
     * @throws ExcepcionApi Si los datos requeridos no están presentes o están vacíos.
     */
    public static function desdeArray(array $datos): self
    {
        $errores = [];

        // Soporta identificador_acceso, identificadorAcceso, usuario, correo, username
        $acceso = $datos['identificador_acceso']
            ?? $datos['identificadorAcceso']
            ?? $datos['usuario']
            ?? $datos['correo']
            ?? $datos['username']
            ?? null;

        if ($acceso === null || trim((string)$acceso) === '') {
            $errores['identificador_acceso'] = 'El identificador de acceso (usuario o correo) es obligatorio.';
        }

        // Soporta contrasena, password
        $contrasena = $datos['contrasena']
            ?? $datos['password']
            ?? null;

        if ($contrasena === null || (string)$contrasena === '') {
            $errores['contrasena'] = 'La contraseña es obligatoria.';
        }

        // academia_id opcional (puede venir en el cuerpo o resolverse por cabecera/tenant)
        $academiaId = $datos['academia_id']
            ?? $datos['academiaId']
            ?? null;

        if (!empty($errores)) {
            throw ExcepcionApi::validacion('Datos de autenticación incompletos o inválidos.', $errores);
        }

        return new self(
            identificadorAcceso: trim((string)$acceso),
            contrasena: (string)$contrasena,
            academiaId: ($academiaId !== null && trim((string)$academiaId) !== '') ? trim((string)$academiaId) : null
        );
    }
}
