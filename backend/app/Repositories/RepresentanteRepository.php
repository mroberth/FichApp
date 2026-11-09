<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio para la gestión del padrón de representantes en negocio.representantes
 * y consulta de grupos familiares multi-hijo.
 * Aislamiento multi-tenant por academia_id.
 */
class RepresentanteRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Busca un representante por su ID y academia.
     *
     * @return array<string, mixed>|null
     */
    public function buscarPorId(string $id, string $academiaId): ?array
    {
        $sql = "
            SELECT 
                id,
                academia_id,
                nombres,
                apellidos,
                cedula,
                telefono,
                correo,
                direccion,
                creado_en,
                actualizado_en
            FROM negocio.representantes
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
     * Busca un representante por su cédula dentro de una academia.
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
                cedula,
                telefono,
                correo,
                direccion,
                creado_en,
                actualizado_en
            FROM negocio.representantes
            WHERE academia_id = :academia_id
              AND UPPER(TRIM(cedula)) = UPPER(TRIM(:cedula))
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'cedula'      => $cedula,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    /**
     * Busca representantes que coincidan con un término en nombres, apellidos o cédula.
     *
     * @return array<int, array<string, mixed>>
     */
    public function buscar(string $academiaId, string $termino, int $limite = 20): array
    {
        $sql = "
            SELECT 
                r.id,
                r.academia_id,
                r.nombres,
                r.apellidos,
                r.cedula,
                r.telefono,
                r.correo,
                r.direccion,
                (
                    SELECT COUNT(*)::int
                    FROM negocio.jugadores_representantes jr
                    WHERE jr.representante_id = r.id AND jr.academia_id = r.academia_id
                ) AS total_hijos
            FROM negocio.representantes r
            WHERE r.academia_id = :academia_id
              AND (
                  LOWER(r.nombres) LIKE :termino
                  OR LOWER(r.apellidos) LIKE :termino
                  OR UPPER(COALESCE(r.cedula, '')) LIKE UPPER(:termino_exacto)
                  OR r.telefono LIKE :termino_exacto
              )
            ORDER BY r.apellidos ASC, r.nombres ASC
            LIMIT :limite
        ";

        $terminoLike = '%' . mb_strtolower(trim($termino)) . '%';
        $terminoExacto = '%' . trim($termino) . '%';

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':academia_id', $academiaId, PDO::PARAM_STR);
        $stmt->bindValue(':termino', $terminoLike, PDO::PARAM_STR);
        $stmt->bindValue(':termino_exacto', $terminoExacto, PDO::PARAM_STR);
        $stmt->bindValue(':limite', $limite, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Inserta un nuevo representante y retorna su UUID generado.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(string $academiaId, array $datos): string
    {
        $sql = "
            INSERT INTO negocio.representantes (
                academia_id,
                nombres,
                apellidos,
                cedula,
                telefono,
                correo,
                direccion
            ) VALUES (
                :academia_id,
                :nombres,
                :apellidos,
                :cedula,
                :telefono,
                :correo,
                :direccion
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'nombres'     => trim((string)$datos['nombres']),
            'apellidos'   => trim((string)$datos['apellidos']),
            'cedula'      => isset($datos['cedula']) && trim((string)$datos['cedula']) !== '' ? strtoupper(trim((string)$datos['cedula'])) : null,
            'telefono'    => trim((string)$datos['telefono']),
            'correo'      => isset($datos['correo']) && trim((string)$datos['correo']) !== '' ? mb_strtolower(trim((string)$datos['correo'])) : null,
            'direccion'   => isset($datos['direccion']) && trim((string)$datos['direccion']) !== '' ? trim((string)$datos['direccion']) : null,
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Actualiza los datos de un representante existente.
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
        if (array_key_exists('cedula', $datos)) {
            $campos[] = 'cedula = :cedula';
            $params['cedula'] = isset($datos['cedula']) && trim((string)$datos['cedula']) !== '' ? strtoupper(trim((string)$datos['cedula'])) : null;
        }
        if (array_key_exists('telefono', $datos)) {
            $campos[] = 'telefono = :telefono';
            $params['telefono'] = trim((string)$datos['telefono']);
        }
        if (array_key_exists('correo', $datos)) {
            $campos[] = 'correo = :correo';
            $params['correo'] = isset($datos['correo']) && trim((string)$datos['correo']) !== '' ? mb_strtolower(trim((string)$datos['correo'])) : null;
        }
        if (array_key_exists('direccion', $datos)) {
            $campos[] = 'direccion = :direccion';
            $params['direccion'] = isset($datos['direccion']) && trim((string)$datos['direccion']) !== '' ? trim((string)$datos['direccion']) : null;
        }

        if (empty($campos)) {
            return false;
        }

        $campos[] = 'actualizado_en = CURRENT_TIMESTAMP';
        $sql = "UPDATE negocio.representantes SET " . implode(', ', $campos) . " WHERE id = :id AND academia_id = :academia_id";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    /**
     * Obtiene el grupo familiar completo asociado a un representante:
     * Datos del tutor y lista de todos sus representados (hijos/atletas)
     * con su categoría, equipo actual y tipo de relación.
     *
     * @return array<string, mixed>|null
     */
    public function obtenerGrupoFamiliar(string $representanteId, string $academiaId): ?array
    {
        $representante = $this->buscarPorId($representanteId, $academiaId);
        if ($representante === null) {
            return null;
        }

        $sqlHijos = "
            SELECT 
                j.id AS jugador_id,
                j.nombres,
                j.apellidos,
                j.fecha_nacimiento,
                j.cedula,
                j.sexo,
                j.ficha_medica,
                j.estado,
                jr.id AS vinculo_id,
                jr.tipo_relacion,
                jr.es_contacto_principal,
                eq.id AS equipo_id,
                eq.nombre AS equipo_nombre,
                cat.id AS categoria_id,
                cat.nombre AS categoria_nombre,
                aje.numero_camiseta,
                aje.posicion,
                aje.temporada
            FROM negocio.jugadores_representantes jr
            JOIN negocio.jugadores j ON j.id = jr.jugador_id
            LEFT JOIN negocio.asignaciones_jugadores_equipos aje 
                   ON aje.jugador_id = j.id AND aje.vigente_hasta IS NULL
            LEFT JOIN negocio.equipos eq ON eq.id = aje.equipo_id
            LEFT JOIN negocio.categorias cat ON cat.id = eq.categoria_id
            WHERE jr.representante_id = :representante_id
              AND jr.academia_id = :academia_id
              AND j.eliminado_en IS NULL
            ORDER BY j.fecha_nacimiento ASC, j.apellidos ASC
        ";

        $stmt = $this->pdo->prepare($sqlHijos);
        $stmt->execute([
            'representante_id' => $representanteId,
            'academia_id'      => $academiaId,
        ]);

        $hijos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parsear ficha médica JSONB en cada atleta
        foreach ($hijos as &$hijo) {
            if (isset($hijo['ficha_medica']) && is_string($hijo['ficha_medica'])) {
                $hijo['ficha_medica'] = json_decode($hijo['ficha_medica'], true) ?: [];
            }
        }

        $representante['hijos'] = $hijos;
        $representante['total_hijos'] = count($hijos);

        return $representante;
    }
}
