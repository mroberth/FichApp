<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Core\ExcepcionApi;

/**
 * DTO para la inscripción o registro integral de un jugador,
 * vinculándolo a su representante (existente o nuevo) y opcionalmente a un equipo.
 * Inmutable y fuertemente tipado para PHP 8.5+.
 */
final readonly class RegistrarJugadorDTO
{
    /**
     * @param array<string, mixed> $fichaMedica
     */
    public function __construct(
        public string $nombres,
        public string $apellidos,
        public ?string $fechaNacimiento = null,
        public ?string $cedula = null,
        public ?string $sexo = null,
        public array $fichaMedica = [],
        public ?string $representanteId = null,
        public ?CrearRepresentanteDTO $datosRepresentante = null,
        public string $tipoRelacion = 'representante_legal',
        public bool $esContactoPrincipal = true,
        public ?string $equipoId = null,
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

        // 1. Datos obligatorios del jugador
        $nombres = $datos['nombres'] ?? null;
        if ($nombres === null || trim((string)$nombres) === '') {
            $errores['nombres'] = 'Los nombres del jugador son obligatorios.';
        }

        $apellidos = $datos['apellidos'] ?? null;
        if ($apellidos === null || trim((string)$apellidos) === '') {
            $errores['apellidos'] = 'Los apellidos del jugador son obligatorios.';
        }

        // 2. Sexo (M o F opcional)
        $sexo = !empty($datos['sexo']) ? strtoupper(trim((string)$datos['sexo'])) : null;
        if ($sexo !== null && !in_array($sexo, ['M', 'F'], true)) {
            $errores['sexo'] = 'El sexo debe ser "M" o "F".';
        }

        // 3. Fecha de nacimiento
        $fechaNacimiento = !empty($datos['fecha_nacimiento']) ? trim((string)$datos['fecha_nacimiento']) : null;
        if ($fechaNacimiento !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaNacimiento)) {
            $errores['fecha_nacimiento'] = 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.';
        }

        // 4. Ficha médica
        $fichaMedica = [];
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

        // 5. Representante: o bien viene representante_id, o bien vienen datos de representante
        $representanteId = !empty($datos['representante_id']) ? trim((string)$datos['representante_id']) : null;
        $datosRepresentante = null;

        if ($representanteId === null) {
            // Verificar si vienen datos en 'representante' o en plano
            $repArr = is_array($datos['representante'] ?? null) ? $datos['representante'] : null;
            if ($repArr !== null) {
                $datosRepresentante = CrearRepresentanteDTO::desdeArray($repArr);
            } elseif (!empty($datos['representante_nombres']) || !empty($datos['representante_telefono'])) {
                $datosRepresentante = CrearRepresentanteDTO::desdeArray([
                    'nombres'   => $datos['representante_nombres'] ?? '',
                    'apellidos' => $datos['representante_apellidos'] ?? '',
                    'telefono'  => $datos['representante_telefono'] ?? '',
                    'cedula'    => $datos['representante_cedula'] ?? null,
                    'correo'    => $datos['representante_correo'] ?? null,
                    'direccion' => $datos['representante_direccion'] ?? null,
                ]);
            } else {
                $errores['representante'] = 'Debe indicar un representante existente (representante_id) o suministrar los datos del nuevo representante.';
            }
        }

        // 6. Equipo y asignación opcional
        $equipoId = !empty($datos['equipo_id']) ? trim((string)$datos['equipo_id']) : null;
        $temporada = !empty($datos['temporada']) ? trim((string)$datos['temporada']) : date('Y');
        $numeroCamiseta = isset($datos['numero_camiseta']) && $datos['numero_camiseta'] !== '' ? (int)$datos['numero_camiseta'] : null;
        $posicion = !empty($datos['posicion']) ? trim((string)$datos['posicion']) : null;

        $tipoRelacion = !empty($datos['tipo_relacion']) ? trim((string)$datos['tipo_relacion']) : 'representante_legal';
        $esContactoPrincipal = isset($datos['es_contacto_principal']) ? (bool)$datos['es_contacto_principal'] : true;

        if (!empty($errores)) {
            throw ExcepcionApi::validacion('Datos de registro de jugador inválidos o incompletos.', $errores);
        }

        return new self(
            nombres: trim((string)$nombres),
            apellidos: trim((string)$apellidos),
            fechaNacimiento: $fechaNacimiento,
            cedula: !empty($datos['cedula']) ? strtoupper(trim((string)$datos['cedula'])) : null,
            sexo: $sexo,
            fichaMedica: $fichaMedica,
            representanteId: $representanteId,
            datosRepresentante: $datosRepresentante,
            tipoRelacion: $tipoRelacion,
            esContactoPrincipal: $esContactoPrincipal,
            equipoId: $equipoId,
            temporada: $temporada,
            numeroCamiseta: $numeroCamiseta,
            posicion: $posicion
        );
    }
}
