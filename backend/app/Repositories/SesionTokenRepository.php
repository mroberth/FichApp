<?php

declare(strict_types=1);

namespace App\Repositories;

use PDO;
use App\Core\Database;

/**
 * Repositorio para la gestión de sesiones y tokens Bearer en seguridad.sesiones_tokens.
 * Los tokens reales nunca se guardan en plano, solo su hash SHA-256.
 */
class SesionTokenRepository
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
    }

    /**
     * Registra un nuevo token de sesión activo.
     */
    public function crear(
        string $academiaId,
        string $usuarioId,
        string $tokenHash,
        string $expiraEn,
        ?string $ipOrigen = null,
        ?string $userAgent = null
    ): string {
        $sql = "
            INSERT INTO seguridad.sesiones_tokens (
                academia_id,
                usuario_id,
                token_hash,
                ip_origen,
                user_agent,
                expira_en
            ) VALUES (
                :academia_id,
                :usuario_id,
                :token_hash,
                :ip_origen,
                :user_agent,
                :expira_en
            ) RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'academia_id' => $academiaId,
            'usuario_id'  => $usuarioId,
            'token_hash'  => $tokenHash,
            'ip_origen'   => $ipOrigen,
            'user_agent'  => $userAgent,
            'expira_en'   => $expiraEn,
        ]);

        return (string)$stmt->fetchColumn();
    }

    /**
     * Busca una sesión activa no revocada y vigente por el hash SHA-256 de su token.
     * Incluye datos completos del usuario y academia asociada.
     *
     * @return array<string, mixed>|null
     */
    public function buscarSesionActiva(string $tokenHash): ?array
    {
        $sql = "
            SELECT 
                s.id AS sesion_id,
                s.academia_id,
                s.usuario_id,
                s.token_hash,
                s.ip_origen,
                s.user_agent,
                s.expira_en,
                s.revocado_en,
                s.creado_en AS sesion_creada_en,
                u.nombre AS usuario_nombre,
                u.identificador_acceso,
                u.correo AS usuario_correo,
                u.telefono AS usuario_telefono,
                u.rol AS usuario_rol,
                u.estado AS usuario_estado,
                a.nombre AS academia_nombre,
                a.estado AS academia_estado
            FROM seguridad.sesiones_tokens s
            JOIN seguridad.usuarios u ON s.usuario_id = u.id
            JOIN negocio.academias a ON s.academia_id = a.id
            WHERE s.token_hash = :token_hash
              AND s.revocado_en IS NULL
              AND s.expira_en > CURRENT_TIMESTAMP
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['token_hash' => $tokenHash]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        return $fila ?: null;
    }

    /**
     * Revoca un token activo estableciendo revocado_en = CURRENT_TIMESTAMP.
     *
     * @return bool True si se revocó, false si ya estaba revocado o no existía.
     */
    public function revocar(string $tokenHash): bool
    {
        $sql = "
            UPDATE seguridad.sesiones_tokens
            SET revocado_en = CURRENT_TIMESTAMP
            WHERE token_hash = :token_hash
              AND revocado_en IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['token_hash' => $tokenHash]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Revoca todas las sesiones activas de un usuario (ej. cambio de clave o desactivación).
     *
     * @return int Número de sesiones revocadas.
     */
    public function revocarPorUsuario(string $usuarioId): int
    {
        $sql = "
            UPDATE seguridad.sesiones_tokens
            SET revocado_en = CURRENT_TIMESTAMP
            WHERE usuario_id = :usuario_id
              AND revocado_en IS NULL
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute(['usuario_id' => $usuarioId]);

        return $stmt->rowCount();
    }
}
