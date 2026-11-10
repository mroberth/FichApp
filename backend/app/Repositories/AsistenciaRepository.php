<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

class AsistenciaRepository
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::getConnection();
    }

    /**
     * Inserta o actualiza idempotentemente una sesión de asistencia generada en el cliente móvil.
     */
    public function guardarSesionIdempotente(
        string $id,
        string $academiaId,
        string $equipoId,
        string $fechaSesion,
        ?string $lugar,
        ?string $observaciones,
        string $creadoPor
    ): void {
        $sql = "
            INSERT INTO negocio.sesiones_asistencia (
                id, academia_id, equipo_id, fecha_sesion, lugar, observaciones, creado_por, sincronizado_en
            ) VALUES (
                :id, :academia_id, :equipo_id, :fecha_sesion, :lugar, :observaciones, :creado_por, CURRENT_TIMESTAMP
            )
            ON CONFLICT (id) DO UPDATE SET
                lugar = EXCLUDED.lugar,
                observaciones = EXCLUDED.observaciones,
                sincronizado_en = CURRENT_TIMESTAMP
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'            => $id,
            'academia_id'   => $academiaId,
            'equipo_id'     => $equipoId,
            'fecha_sesion'  => $fechaSesion,
            'lugar'         => $lugar,
            'observaciones' => $observaciones,
            'creado_por'    => $creadoPor,
        ]);
    }

    /**
     * Inserta o actualiza idempotentemente un registro individual de asistencia.
     */
    public function guardarRegistroIdempotente(
        string $id,
        string $academiaId,
        string $sesionId,
        string $jugadorId,
        string $estadoAsistencia,
        ?string $observaciones
    ): void {
        $sql = "
            INSERT INTO negocio.registros_asistencia (
                id, academia_id, sesion_id, jugador_id, estado_asistencia, observaciones, creado_en
            ) VALUES (
                :id, :academia_id, :sesion_id, :jugador_id, :estado_asistencia, :observaciones, CURRENT_TIMESTAMP
            )
            ON CONFLICT (sesion_id, jugador_id) DO UPDATE SET
                estado_asistencia = EXCLUDED.estado_asistencia,
                observaciones = EXCLUDED.observaciones
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'                => $id,
            'academia_id'       => $academiaId,
            'sesion_id'         => $sesionId,
            'jugador_id'        => $jugadorId,
            'estado_asistencia' => $estadoAsistencia,
            'observaciones'     => $observaciones,
        ]);
    }

    /**
     * Obtiene el listado de sesiones de asistencia de una academia.
     */
    public function listarSesiones(string $academiaId, ?string $equipoId = null, int $limite = 50): array
    {
        $sql = "
            SELECT 
                s.id,
                s.academia_id,
                s.equipo_id,
                e.nombre AS equipo_nombre,
                c.nombre AS categoria_nombre,
                s.fecha_sesion,
                s.lugar,
                s.observaciones,
                s.creado_por,
                u.nombre AS entrenador_nombre,
                s.sincronizado_en,
                COUNT(r.id) AS total_atletas,
                SUM(CASE WHEN r.estado_asistencia = 'presente' THEN 1 ELSE 0 END) AS presentes,
                SUM(CASE WHEN r.estado_asistencia = 'ausente' THEN 1 ELSE 0 END) AS ausentes,
                SUM(CASE WHEN r.estado_asistencia = 'justificado' THEN 1 ELSE 0 END) AS justificados
            FROM negocio.sesiones_asistencia s
            JOIN negocio.equipos e ON s.equipo_id = e.id
            JOIN negocio.categorias c ON e.categoria_id = c.id
            JOIN seguridad.usuarios u ON s.creado_por = u.id
            LEFT JOIN negocio.registros_asistencia r ON s.id = r.sesion_id
            WHERE s.academia_id = :academia_id
        ";

        $params = ['academia_id' => $academiaId];

        if ($equipoId) {
            $sql .= " AND s.equipo_id = :equipo_id";
            $params['equipo_id'] = $equipoId;
        }

        $sql .= "
            GROUP BY s.id, e.nombre, c.nombre, u.nombre
            ORDER BY s.fecha_sesion DESC
            LIMIT :limite
        ";

        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
