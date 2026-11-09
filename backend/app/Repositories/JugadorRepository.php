<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio para la gestión de fichas de jugadores, vínculos familiares
 * y asignaciones a equipos en negocio.jugadores.
 * Aislamiento multi-tenant por academia_id.
 */
class JugadorRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Busca un jugador por su ID y academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorId(string $id, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                j.id,
                j.academia_id,
                j.nombres,
                j.apellidos,
                j.fecha_nacimiento,
                j.cedula,
                j.sexo,
                j.ficha_medica,
                j.estado,
                j.creado_en,
                j.actualizado_en,
                j.eliminado_en,
                eq.id AS equipo_id,
                eq.nombre AS equipo_nombre,
                cat.id AS categoria_id,
                cat.nombre AS categoria_nombre,
                aje.numero_camiseta,
                aje.posicion,
                aje.temporada
            FROM negocio.jugadores j
            LEFT JOIN negocio.asignaciones_jugadores_equipos aje 
                   ON aje.jugador_id = j.id AND aje.vigente_hasta IS NULL
            LEFT JOIN negocio.equipos eq ON eq.id = aje.equipo_id
            LEFT JOIN negocio.categorias cat ON cat.id = eq.categoria_id
            WHERE j.id = :id 
              AND j.academia_id = :academia_id
              AND j.eliminado_en IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id'          => $id,
            'academia_id' => $academiaId,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$fila) {
            return null;
        }

        if (isset($fila['ficha_medica']) && is_string($fila['ficha_medica'])) {
            $fila['ficha_medica'] = json_decode($fila['ficha_medica'], true) ?: [];
        }

        return $fila;
    }

    /**
     * Busca un jugador activo por su cédula dentro de una academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorCedula(string $cedula, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                nombres,
                apellidos,
                fecha_nacimiento,
                cedula,
                sexo,
                ficha_medica,
                estado,
                creado_en,
                actualizado_en
            FROM negocio.jugadores
            WHERE academia_id = :academia_id
              AND UPPER(TRIM(cedula)) = UPPER(TRIM(:cedula))
              AND eliminado_en IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'cedula'      => $cedula,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$fila) {
            return null;
        }

        if (isset($fila['ficha_medica']) && is_string($fila['ficha_medica'])) {
            $fila['ficha_medica'] = json_decode($fila['ficha_medica'], true) ?: [];
        }

        return $fila;
    }

    /**
     * Lista jugadores según filtros multi-criterio (categoría, equipo, búsqueda por nombre/cédula, estado).
     *
     * @param array<string, mixed> $filtros
     * @return array<int, array<string, mixed>>
     */
    public function listar(string $academiaId, array $filtros = []): array
    {
        $sql = "
            SELECT 
                j.id,
                j.academia_id,
                j.nombres,
                j.apellidos,
                j.fecha_nacimiento,
                j.cedula,
                j.sexo,
                j.estado,
                j.creado_en,
                eq.id AS equipo_id,
                eq.nombre AS equipo_nombre,
                cat.id AS categoria_id,
                cat.nombre AS categoria_nombre,
                aje.numero_camiseta,
                aje.posicion,
                (
                    SELECT string_agg(r.nombres || ' ' || r.apellidos, ', ')
                    FROM negocio.jugadores_representantes jr
                    JOIN negocio.representantes r ON r.id = jr.representante_id
                    WHERE jr.jugador_id = j.id
                ) AS representantes_nombres
            FROM negocio.jugadores j
            LEFT JOIN negocio.asignaciones_jugadores_equipos aje 
                   ON aje.jugador_id = j.id AND aje.vigente_hasta IS NULL
            LEFT JOIN negocio.equipos eq ON eq.id = aje.equipo_id
            LEFT JOIN negocio.categorias cat ON cat.id = eq.categoria_id
            WHERE j.academia_id = :academia_id
              AND j.eliminado_en IS NULL
        ";

        $params = ['academia_id' => $academiaId];

        if (!empty($filtros['categoria_id'])) {
            $sql .= " AND cat.id = :categoria_id";
            $params['categoria_id'] = $filtros['categoria_id'];
        }

        if (!empty($filtros['equipo_id'])) {
            $sql .= " AND eq.id = :equipo_id";
            $params['equipo_id'] = $filtros['equipo_id'];
        }

        if (!empty($filtros['estado'])) {
            $sql .= " AND j.estado = :estado";
            $params['estado'] = $filtros['estado'];
        }

        if (!empty($filtros['busqueda'])) {
            $sql .= " AND (
                LOWER(j.nombres) LIKE :busqueda
                OR LOWER(j.apellidos) LIKE :busqueda
                OR UPPER(COALESCE(j.cedula, '')) LIKE UPPER(:busqueda_exacta)
            )";
            $params['busqueda'] = '%' . mb_strtolower(trim((string)$filtros['busqueda'])) . '%';
            $params['busqueda_exacta'] = '%' . trim((string)$filtros['busqueda']) . '%';
        }

        $sql .= " ORDER BY j.apellidos ASC, j.nombres ASC";

        if (isset($filtros['limite']) && (int)$filtros['limite'] > 0) {
            $limite = (int)$filtros['limite'];
            $offset = isset($filtros['offset']) ? max(0, (int)$filtros['offset']) : 0;
            $sql .= " LIMIT {$limite} OFFSET {$offset}";
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Cuenta el total de jugadores según filtros multi-criterio (para paginación).
     *
     * @param array<string, mixed> $filtros
     */
    public function contar(string $academiaId, array $filtros = []): int
    {
        $sql = "
            SELECT COUNT(*)::int
            FROM negocio.jugadores j
            LEFT JOIN negocio.asignaciones_jugadores_equipos aje 
                   ON aje.jugador_id = j.id AND aje.vigente_hasta IS NULL
            LEFT JOIN negocio.equipos eq ON eq.id = aje.equipo_id
            LEFT JOIN negocio.categorias cat ON cat.id = eq.categoria_id
            WHERE j.academia_id = :academia_id
              AND j.eliminado_en IS NULL
        ";

        $params = ['academia_id' => $academiaId];

        if (!empty($filtros['categoria_id'])) {
            $sql .= " AND cat.id = :categoria_id";
            $params['categoria_id'] = $filtros['categoria_id'];
        }

        if (!empty($filtros['equipo_id'])) {
            $sql .= " AND eq.id = :equipo_id";
            $params['equipo_id'] = $filtros['equipo_id'];
        }

        if (!empty($filtros['estado'])) {
            $sql .= " AND j.estado = :estado";
            $params['estado'] = $filtros['estado'];
        }

        if (!empty($filtros['busqueda'])) {
            $sql .= " AND (
                LOWER(j.nombres) LIKE :busqueda
                OR LOWER(j.apellidos) LIKE :busqueda
                OR UPPER(COALESCE(j.cedula, '')) LIKE UPPER(:busqueda_exacta)
            )";
            $params['busqueda'] = '%' . mb_strtolower(trim((string)$filtros['busqueda'])) . '%';
            $params['busqueda_exacta'] = '%' . trim((string)$filtros['busqueda']) . '%';
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int)$stmt->fetchColumn();
    }

    /**
     * Inserta un nuevo jugador y retorna su UUID generado.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(string $academiaId, array $datos): string
    {
        $sql = "
            INSERT INTO negocio.jugadores (
                academia_id,
                nombres,
                apellidos,
                fecha_nacimiento,
                cedula,
                sexo,
                ficha_medica,
                estado
            ) VALUES (
                :academia_id,
                :nombres,
                :apellidos,
                :fecha_nacimiento,
                :cedula,
                :sexo,
                :ficha_medica::jsonb,
                :estado
            ) RETURNING id
        ";

        $fichaMedicaJson = is_array($datos['ficha_medica'] ?? null)
            ? json_encode($datos['ficha_medica'])
            : (string)($datos['ficha_medica'] ?? '{}');

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'      => $academiaId,
            'nombres'          => trim((string)$datos['nombres']),
            'apellidos'        => trim((string)$datos['apellidos']),
            'fecha_nacimiento' => !empty($datos['fecha_nacimiento']) ? (string)$datos['fecha_nacimiento'] : null,
            'cedula'           => !empty($datos['cedula']) ? strtoupper(trim((string)$datos['cedula'])) : null,
            'sexo'             => !empty($datos['sexo']) ? strtoupper(trim((string)$datos['sexo'])) : null,
            'ficha_medica'     => $fichaMedicaJson,
            'estado'           => (string)($datos['estado'] ?? 'activo'),
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Actualiza los datos de un jugador existente.
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

        if (array_key_exists('nombres', $datos)) {
            $campos[] = 'nombres = :nombres';
            $params['nombres'] = trim((string)$datos['nombres']);
        }
        if (array_key_exists('apellidos', $datos)) {
            $campos[] = 'apellidos = :apellidos';
            $params['apellidos'] = trim((string)$datos['apellidos']);
        }
        if (array_key_exists('fecha_nacimiento', $datos)) {
            $campos[] = 'fecha_nacimiento = :fecha_nacimiento';
            $params['fecha_nacimiento'] = !empty($datos['fecha_nacimiento']) ? (string)$datos['fecha_nacimiento'] : null;
        }
        if (array_key_exists('cedula', $datos)) {
            $campos[] = 'cedula = :cedula';
            $params['cedula'] = !empty($datos['cedula']) ? strtoupper(trim((string)$datos['cedula'])) : null;
        }
        if (array_key_exists('sexo', $datos)) {
            $campos[] = 'sexo = :sexo';
            $params['sexo'] = !empty($datos['sexo']) ? strtoupper(trim((string)$datos['sexo'])) : null;
        }
        if (array_key_exists('ficha_medica', $datos)) {
            $campos[] = 'ficha_medica = :ficha_medica::jsonb';
            $params['ficha_medica'] = is_array($datos['ficha_medica'])
                ? json_encode($datos['ficha_medica'])
                : (string)$datos['ficha_medica'];
        }
        if (array_key_exists('estado', $datos)) {
            $campos[] = 'estado = :estado';
            $params['estado'] = (string)$datos['estado'];
        }

        if (empty($campos)) {
            return false;
        }

        $campos[] = 'actualizado_en = CURRENT_TIMESTAMP';
        $sql = "UPDATE negocio.jugadores SET " . implode(', ', $campos) . " WHERE id = :id AND academia_id = :academia_id AND eliminado_en IS NULL";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    /**
     * Realiza un soft-delete del jugador, marcándolo como inactivo y estableciendo eliminado_en.
     */
    public function eliminar(string $id, string $academiaId): bool
    {
        $sql = "
            UPDATE negocio.jugadores 
            SET estado = 'inactivo', eliminado_en = CURRENT_TIMESTAMP, actualizado_en = CURRENT_TIMESTAMP
            WHERE id = :id AND academia_id = :academia_id AND eliminado_en IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'id'          => $id,
            'academia_id' => $academiaId,
        ]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Vincula un jugador con un representante legal en negocio.jugadores_representantes.
     */
    public function vincularRepresentante(
        string $academiaId,
        string $jugadorId,
        string $representanteId,
        string $tipoRelacion = 'representante_legal',
        bool $esContactoPrincipal = false
    ): string {
        $sql = "
            INSERT INTO negocio.jugadores_representantes (
                academia_id,
                jugador_id,
                representante_id,
                tipo_relacion,
                es_contacto_principal
            ) VALUES (
                :academia_id,
                :jugador_id,
                :representante_id,
                :tipo_relacion,
                :es_contacto_principal
            )
            ON CONFLICT (academia_id, jugador_id, representante_id)
            DO UPDATE SET 
                tipo_relacion = EXCLUDED.tipo_relacion,
                es_contacto_principal = EXCLUDED.es_contacto_principal
            RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'           => $academiaId,
            'jugador_id'            => $jugadorId,
            'representante_id'      => $representanteId,
            'tipo_relacion'         => $tipoRelacion,
            'es_contacto_principal' => $esContactoPrincipal ? 'true' : 'false',
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Obtiene los representantes vinculados a un jugador.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerRepresentantes(string $jugadorId, string $academiaId): array
    {
        $sql = "
            SELECT 
                r.id AS representante_id,
                r.nombres,
                r.apellidos,
                r.cedula,
                r.telefono,
                r.correo,
                r.direccion,
                jr.id AS vinculo_id,
                jr.tipo_relacion,
                jr.es_contacto_principal
            FROM negocio.jugadores_representantes jr
            JOIN negocio.representantes r ON r.id = jr.representante_id
            WHERE jr.jugador_id = :jugador_id
              AND jr.academia_id = :academia_id
            ORDER BY jr.es_contacto_principal DESC, r.apellidos ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'jugador_id'  => $jugadorId,
            'academia_id' => $academiaId,
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Asigna un jugador a un equipo deportivo en una temporada específica.
     * Cierra cualquier asignación vigente previa en el mismo equipo.
     */
    public function asignarAEquipo(
        string $academiaId,
        string $jugadorId,
        string $equipoId,
        string $temporada = '2026',
        ?int $numeroCamiseta = null,
        ?string $posicion = null
    ): string {
        $sql = "
            INSERT INTO negocio.asignaciones_jugadores_equipos (
                academia_id,
                jugador_id,
                equipo_id,
                temporada,
                numero_camiseta,
                posicion,
                vigente_desde
            ) VALUES (
                :academia_id,
                :jugador_id,
                :equipo_id,
                :temporada,
                :numero_camiseta,
                :posicion,
                CURRENT_DATE
            )
            ON CONFLICT (academia_id, jugador_id, equipo_id, temporada)
            DO UPDATE SET 
                numero_camiseta = EXCLUDED.numero_camiseta,
                posicion = EXCLUDED.posicion,
                vigente_hasta = NULL
            RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'     => $academiaId,
            'jugador_id'      => $jugadorId,
            'equipo_id'       => $equipoId,
            'temporada'       => $temporada,
            'numero_camiseta' => $numeroCamiseta,
            'posicion'        => $posicion,
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Obtiene el historial de equipos a los que pertenece o ha pertenecido el atleta.
     *
     * @return array<int, array<string, mixed>>
     */
    public function obtenerEquipos(string $jugadorId, string $academiaId): array
    {
        $sql = "
            SELECT 
                aje.id AS asignacion_id,
                aje.temporada,
                aje.numero_camiseta,
                aje.posicion,
                aje.vigente_desde,
                aje.vigente_hasta,
                (aje.vigente_hasta IS NULL) AS es_vigente,
                eq.id AS equipo_id,
                eq.nombre AS equipo_nombre,
                cat.id AS categoria_id,
                cat.nombre AS categoria_nombre
            FROM negocio.asignaciones_jugadores_equipos aje
            JOIN negocio.equipos eq ON eq.id = aje.equipo_id
            JOIN negocio.categorias cat ON cat.id = eq.categoria_id
            WHERE aje.jugador_id = :jugador_id
              AND aje.academia_id = :academia_id
            ORDER BY aje.vigente_desde DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'jugador_id'  => $jugadorId,
            'academia_id' => $academiaId,
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtiene la ficha consolidada completa del atleta (datos personales, médicos, tutores y equipos).
     *
     * @return array<string, mixed>|null
     */
    public function obtenerFichaCompleta(string $jugadorId, string $academiaId): ?array
    {
        $jugador = $this->buscarPorId($jugadorId, $academiaId);
        if ($jugador === null) {
            return null;
        }

        $jugador['representantes'] = $this->obtenerRepresentantes($jugadorId, $academiaId);
        $jugador['historial_equipos'] = $this->obtenerEquipos($jugadorId, $academiaId);

        return $jugador;
    }
}
