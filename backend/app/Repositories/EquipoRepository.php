<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio para la gestión de equipos deportivos en negocio.equipos y sus entrenadores.
 * Aislamiento multi-tenant por academia_id.
 */
class EquipoRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Busca un equipo por su ID y academia, incluyendo el nombre de su categoría.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorId(string $id, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                e.id,
                e.academia_id,
                e.categoria_id,
                e.nombre,
                e.estado,
                e.creado_en,
                e.actualizado_en,
                c.nombre AS categoria_nombre,
                c.modalidad AS categoria_modalidad
            FROM negocio.equipos e
            JOIN negocio.categorias c ON c.id = e.categoria_id
            WHERE e.id = :id AND e.academia_id = :academia_id
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
     * Busca un equipo por su nombre y categoría en una academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorNombreYCategoria(string $nombre, string $categoriaId, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                categoria_id,
                nombre,
                estado,
                creado_en,
                actualizado_en
            FROM negocio.equipos
            WHERE academia_id = :academia_id
              AND categoria_id = :categoria_id
              AND LOWER(TRIM(nombre)) = LOWER(TRIM(:nombre))
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'  => $academiaId,
            'categoria_id' => $categoriaId,
            'nombre'       => $nombre,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    /**
     * Lista los equipos de una academia, con filtros opcionales por categoría y estado.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarPorAcademia(string $academiaId, ?string $categoriaId = null, ?string $estado = null): array
    {
        $sql = "
            SELECT 
                e.id,
                e.academia_id,
                e.categoria_id,
                e.nombre,
                e.estado,
                e.creado_en,
                e.actualizado_en,
                c.nombre AS categoria_nombre,
                c.modalidad AS categoria_modalidad,
                (
                    SELECT COUNT(*)::int 
                    FROM negocio.asignaciones_jugadores_equipos aje
                    WHERE aje.equipo_id = e.id AND aje.vigente_hasta IS NULL
                ) AS total_jugadores_activos
            FROM negocio.equipos e
            JOIN negocio.categorias c ON c.id = e.categoria_id
            WHERE e.academia_id = :academia_id
        ";

        $params = ['academia_id' => $academiaId];

        if ($categoriaId !== null && trim($categoriaId) !== '') {
            $sql .= " AND e.categoria_id = :categoria_id";
            $params['categoria_id'] = $categoriaId;
        }

        if ($estado !== null && trim($estado) !== '') {
            $sql .= " AND e.estado = :estado";
            $params['estado'] = $estado;
        }

        $sql .= " ORDER BY c.edad_minima ASC, e.nombre ASC";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Inserta un nuevo equipo y retorna su UUID generado.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(string $academiaId, array $datos): string
    {
        $sql = "
            INSERT INTO negocio.equipos (
                academia_id,
                categoria_id,
                nombre,
                estado
            ) VALUES (
                :academia_id,
                :categoria_id,
                :nombre,
                :estado
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'  => $academiaId,
            'categoria_id' => (string)$datos['categoria_id'],
            'nombre'       => trim((string)$datos['nombre']),
            'estado'       => (string)($datos['estado'] ?? 'activo'),
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Actualiza un equipo existente.
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
        if (array_key_exists('categoria_id', $datos)) {
            $campos[] = 'categoria_id = :categoria_id';
            $params['categoria_id'] = (string)$datos['categoria_id'];
        }
        if (array_key_exists('estado', $datos)) {
            $campos[] = 'estado = :estado';
            $params['estado'] = (string)$datos['estado'];
        }

        if (empty($campos)) {
            return false;
        }

        $campos[] = 'actualizado_en = CURRENT_TIMESTAMP';
        $sql = "UPDATE negocio.equipos SET " . implode(', ', $campos) . " WHERE id = :id AND academia_id = :academia_id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    /**
     * Asigna un entrenador a un equipo deportivo.
     */
    public function asignarEntrenador(
        string $academiaId,
        string $entrenadorId,
        string $equipoId,
        string $rol = 'principal',
        ?string $vigenteDesde = null
    ): string {
        $sql = "
            INSERT INTO negocio.asignaciones_entrenadores_equipos (
                academia_id,
                entrenador_id,
                equipo_id,
                rol_en_equipo,
                vigente_desde
            ) VALUES (
                :academia_id,
                :entrenador_id,
                :equipo_id,
                :rol_en_equipo,
                :vigente_desde
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'   => $academiaId,
            'entrenador_id' => $entrenadorId,
            'equipo_id'     => $equipoId,
            'rol_en_equipo' => $rol,
            'vigente_desde' => $vigenteDesde ?: date('Y-m-d'),
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Obtiene los entrenadores asignados a un equipo.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerEntrenadores(string $equipoId, string $academiaId): array
    {
        $sql = "
            SELECT 
                aee.id AS asignacion_id,
                aee.rol_en_equipo,
                aee.vigente_desde,
                aee.vigente_hasta,
                u.id AS entrenador_id,
                u.nombre AS entrenador_nombre,
                u.correo AS entrenador_correo,
                u.telefono AS entrenador_telefono
            FROM negocio.asignaciones_entrenadores_equipos aee
            JOIN seguridad.usuarios u ON u.id = aee.entrenador_id
            WHERE aee.equipo_id = :equipo_id
              AND aee.academia_id = :academia_id
              AND aee.vigente_hasta IS NULL
            ORDER BY aee.rol_en_equipo ASC, u.nombre ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'equipo_id'   => $equipoId,
            'academia_id' => $academiaId,
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Da de baja (cierra vigencia) de una asignación de entrenador.
     */
    public function desasignarEntrenador(string $asignacionId, string $academiaId): bool
    {
        $sql = "
            UPDATE negocio.asignaciones_entrenadores_equipos
            SET vigente_hasta = CURRENT_DATE
            WHERE id = :id AND academia_id = :academia_id AND vigente_hasta IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id'          => $asignacionId,
            'academia_id' => $academiaId,
        ]);

        return $stmt->rowCount() > 0;
    }
}
