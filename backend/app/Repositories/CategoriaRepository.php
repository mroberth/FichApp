<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio para la gestión de categorías deportivas en negocio.categorias.
 * Aislamiento multi-tenant por academia_id.
 */
class CategoriaRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Busca una categoría por su ID y academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorId(string $id, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                nombre,
                modalidad,
                edad_minima,
                edad_maxima,
                estado,
                creado_en,
                actualizado_en
            FROM negocio.categorias
            WHERE id = :id AND academia_id = :academia_id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id'          => $id,
            'academia_id' => $academiaId,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    /**
     * Busca una categoría por su nombre exacto dentro de una academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorNombre(string $nombre, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                nombre,
                modalidad,
                edad_minima,
                edad_maxima,
                estado,
                creado_en,
                actualizado_en
            FROM negocio.categorias
            WHERE academia_id = :academia_id 
              AND LOWER(TRIM(nombre)) = LOWER(TRIM(:nombre))
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'nombre'      => $nombre,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    /**
     * Lista todas las categorías de una academia con filtro de estado opcional.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarPorAcademia(string $academiaId, ?string $estado = null): array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                nombre,
                modalidad,
                edad_minima,
                edad_maxima,
                estado,
                creado_en,
                actualizado_en
            FROM negocio.categorias
            WHERE academia_id = :academia_id
        ";

        $params = ['academia_id' => $academiaId];

        if ($estado !== null && trim($estado) !== '') {
            $sql .= " AND estado = :estado";
            $params['estado'] = $estado;
        }

        $sql .= " ORDER BY edad_minima ASC, nombre ASC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Inserta una nueva categoría deportiva y retorna su UUID generado.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(string $academiaId, array $datos): string
    {
        $sql = "
            INSERT INTO negocio.categorias (
                academia_id,
                nombre,
                modalidad,
                edad_minima,
                edad_maxima,
                estado
            ) VALUES (
                :academia_id,
                :nombre,
                :modalidad,
                :edad_minima,
                :edad_maxima,
                :estado
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'nombre'      => trim((string)$datos['nombre']),
            'modalidad'   => trim((string)($datos['modalidad'] ?? 'fútbol campo')),
            'edad_minima' => isset($datos['edad_minima']) && $datos['edad_minima'] !== null ? (int)$datos['edad_minima'] : null,
            'edad_maxima' => isset($datos['edad_maxima']) && $datos['edad_maxima'] !== null ? (int)$datos['edad_maxima'] : null,
            'estado'      => (string)($datos['estado'] ?? 'activo'),
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Actualiza los datos de una categoría existente.
     *
     * @param array<string, mixed> $datos
     */
    public function actualizar(string $id, string $academiaId, array $datos): bool
    {
        $campos = [];
        $params = [
            'id'          => $id,
            'academia_id' => $academiaId,
        ];

        if (array_key_exists('nombre', $datos)) {
            $campos[] = 'nombre = :nombre';
            $params['nombre'] = trim((string)$datos['nombre']);
        }
        if (array_key_exists('modalidad', $datos)) {
            $campos[] = 'modalidad = :modalidad';
            $params['modalidad'] = trim((string)$datos['modalidad']);
        }
        if (array_key_exists('edad_minima', $datos)) {
            $campos[] = 'edad_minima = :edad_minima';
            $params['edad_minima'] = $datos['edad_minima'] !== null ? (int)$datos['edad_minima'] : null;
        }
        if (array_key_exists('edad_maxima', $datos)) {
            $campos[] = 'edad_maxima = :edad_maxima';
            $params['edad_maxima'] = $datos['edad_maxima'] !== null ? (int)$datos['edad_maxima'] : null;
        }
        if (array_key_exists('estado', $datos)) {
            $campos[] = 'estado = :estado';
            $params['estado'] = (string)$datos['estado'];
        }

        if (empty($campos)) {
            return false;
        }

        $campos[] = 'actualizado_en = CURRENT_TIMESTAMP';
        $sql = "UPDATE negocio.categorias SET " . implode(', ', $campos) . " WHERE id = :id AND academia_id = :academia_id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }
}
