<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;
use App\Core\ExcepcionApi;

/**
 * Repositorio de Usuarios para operaciones puras de base de datos en seguridad.usuarios.
 * Aislamiento multi-tenant por academia_id.
 */
class UsuarioRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Busca un usuario por su identificador de acceso o correo electrónico,
     * opcionalmente filtrando por academia_id.
     *
     * @return array<string, mixed>|null Datos del usuario y de su academia asociada, o null si no existe.
     */
    public function buscarPorAccesoYAcademia(string $acceso, ?string $academiaId = null): ?array
    {
        $sql = "
            SELECT 
                u.id,
                u.academia_id,
                u.nombre,
                u.identificador_acceso,
                u.correo,
                u.telefono,
                u.contrasena_hash,
                u.rol,
                u.estado,
                u.creado_en,
                u.actualizado_en,
                a.nombre AS academia_nombre,
                a.estado AS academia_estado,
                a.rif AS academia_rif
            FROM seguridad.usuarios u
            JOIN negocio.academias a ON u.academia_id = a.id
            WHERE (LOWER(u.identificador_acceso) = LOWER(:acceso) OR LOWER(u.correo) = LOWER(:correo))
        ";

        if ($academiaId !== null && trim($academiaId) !== '') {
            $sql .= " AND u.academia_id = :academia_id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                'acceso'      => $acceso,
                'correo'      => $acceso,
                'academia_id' => $academiaId,
            ]);
            $fila = $stmt->fetch(PDO::FETCH_ASSOC);
            return $fila ?: null;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'acceso' => $acceso,
            'correo' => $acceso,
        ]);
        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($filas) === 0) {
            return null;
        }

        if (count($filas) > 1) {
            throw ExcepcionApi::validacion(
                'El usuario pertenece a múltiples academias. Debe especificar el ID de la academia para iniciar sesión.'
            );
        }

        return $filas[0];
    }

    /**
     * Busca un usuario por su UUID primario.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorId(string $id): ?array
    {
        $sql = "
            SELECT 
                u.id,
                u.academia_id,
                u.nombre,
                u.identificador_acceso,
                u.correo,
                u.telefono,
                u.rol,
                u.estado,
                u.creado_en,
                u.actualizado_en,
                a.nombre AS academia_nombre,
                a.estado AS academia_estado,
                a.rif AS academia_rif
            FROM seguridad.usuarios u
            JOIN negocio.academias a ON u.academia_id = a.id
            WHERE u.id = :id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        return $fila ?: null;
    }

    /**
     * Registra un nuevo usuario en la base de datos y retorna su UUID generado.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(array $datos): string
    {
        $sql = "
            INSERT INTO seguridad.usuarios (
                academia_id,
                nombre,
                identificador_acceso,
                correo,
                telefono,
                contrasena_hash,
                rol,
                estado
            ) VALUES (
                :academia_id,
                :nombre,
                :identificador_acceso,
                :correo,
                :telefono,
                :contrasena_hash,
                :rol,
                :estado
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'          => $datos['academia_id'],
            'nombre'               => $datos['nombre'],
            'identificador_acceso' => $datos['identificador_acceso'],
            'correo'               => $datos['correo'] ?? null,
            'telefono'             => $datos['telefono'] ?? null,
            'contrasena_hash'      => $datos['contrasena_hash'],
            'rol'                  => $datos['rol'] ?? 'entrenador',
            'estado'               => $datos['estado'] ?? 'activo',
        ]);

        return (string)$stmt->fetchColumn();
    }
}
