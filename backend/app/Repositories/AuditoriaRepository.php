<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio de Auditoría para registrar eventos en seguridad.registros_auditoria.
 */
class AuditoriaRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Registra un evento en la bitácora de auditoría.
     *
     * @param string $academiaId UUID de la academia
     * @param string|null $usuarioId UUID del usuario que ejecutó la acción (null si es intento no autenticado)
     * @param string $accion Nombre de la acción (ej. LOGIN_EXITOSO, LOGIN_FALLIDO)
     * @param string $tipoEntidad Nombre de la entidad (ej. seguridad.usuarios, negocio.pagos)
     * @param string $entidadId UUID de la entidad afectada
     * @param array<string, mixed> $metadatos Metadatos adicionales serializados en JSONB
     * @return string UUID del registro de auditoría creado
     */
    public function registrar(
        string $academiaId,
        ?string $usuarioId,
        string $accion,
        string $tipoEntidad,
        string $entidadId,
        array $metadatos = []
    ): string {
        $sql = "
            INSERT INTO seguridad.registros_auditoria (
                academia_id,
                usuario_id,
                accion,
                tipo_entidad,
                entidad_id,
                metadatos
            ) VALUES (
                :academia_id,
                :usuario_id,
                :accion,
                :tipo_entidad,
                :entidad_id,
                :metadatos::jsonb
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id'  => $academiaId,
            'usuario_id'   => $usuarioId,
            'accion'       => $accion,
            'tipo_entidad' => $tipoEntidad,
            'entidad_id'   => $entidadId,
            'metadatos'    => json_encode($metadatos, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);

        return (string)$stmt->fetchColumn();
    }
}
