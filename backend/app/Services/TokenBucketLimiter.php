<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use App\Core\Database;

/**
 * Implementación del algoritmo Token Bucket para Rate Limiting en FichApp.
 * Almacena el estado de los cubos (tokens restantes y marca de tiempo)
 * con persistencia atómica en base de datos PostgreSQL.
 */
class TokenBucketLimiter
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Database::getConnection();
        $this->asegurarTabla();
    }

    /**
     * Consume una cantidad de tokens del bucket correspondiente a la clave suministrada.
     *
     * @param string $clave Identificador único (ej: "login:192.168.1.1" o "login:user@test.com")
     * @param int $capacidad Número máximo de tokens que puede acumular el cubo (ráfaga permitida)
     * @param float $tasaRecargaPorSegundo Tokens que se regeneran por segundo
     * @param int $costo Tokens a consumir en esta llamada (por defecto 1)
     * @return array{permitido: bool, restantes: int, reintento_en: int}
     */
    public function consumir(
        string $clave,
        int $capacidad,
        float $tasaRecargaPorSegundo,
        int $costo = 1
    ): array {
        $ahora = microtime(true);

        // Bloqueo pesimista sobre la clave o creación inicial con ON CONFLICT
        $sql = "
            INSERT INTO seguridad.rate_limits (clave, tokens, ultima_recarga, actualizado_en)
            VALUES (:clave, :tokens, :ahora, CURRENT_TIMESTAMP)
            ON CONFLICT (clave) DO UPDATE
            SET actualizado_en = CURRENT_TIMESTAMP
            RETURNING tokens, ultima_recarga
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'clave'  => $clave,
            'tokens' => (float)$capacidad,
            'ahora'  => $ahora,
        ]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        $tokensActuales = (float)$fila['tokens'];
        $ultimaRecarga = (float)$fila['ultima_recarga'];

        // Calcular regeneración de tokens transcurrida
        $tiempoTranscurrido = max(0.0, $ahora - $ultimaRecarga);
        $tokensRegenerados = $tiempoTranscurrido * $tasaRecargaPorSegundo;
        $tokensDisponibles = min((float)$capacidad, $tokensActuales + $tokensRegenerados);

        if ($tokensDisponibles >= $costo) {
            $nuevosTokens = $tokensDisponibles - $costo;
            $this->actualizarEstado($clave, $nuevosTokens, $ahora);

            return [
                'permitido'    => true,
                'restantes'    => (int)floor($nuevosTokens),
                'reintento_en' => 0,
            ];
        }

        // No hay suficientes tokens: calcular segundos restantes para reponer al menos 1 token
        $tokensFaltantes = $costo - $tokensDisponibles;
        $segundosEspera = (int)ceil($tokensFaltantes / $tasaRecargaPorSegundo);

        // Mantener la recarga acumulada sin consumir
        $this->actualizarEstado($clave, $tokensDisponibles, $ahora);

        return [
            'permitido'    => false,
            'restantes'    => 0,
            'reintento_en' => max(1, $segundosEspera),
        ];
    }

    private function actualizarEstado(string $clave, float $tokens, float $marcaTiempo): void
    {
        $sql = "
            UPDATE seguridad.rate_limits
            SET tokens = :tokens, ultima_recarga = :ultima_recarga, actualizado_en = CURRENT_TIMESTAMP
            WHERE clave = :clave
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            'clave'          => $clave,
            'tokens'         => $tokens,
            'ultima_recarga' => $marcaTiempo,
        ]);
    }

    /**
     * Asegura la existencia de la tabla en el esquema seguridad si no fue creada en migración.
     */
    private function asegurarTabla(): void
    {
        $sql = "
            CREATE TABLE IF NOT EXISTS seguridad.rate_limits (
                clave VARCHAR(120) PRIMARY KEY,
                tokens NUMERIC(10, 4) NOT NULL,
                ultima_recarga NUMERIC(16, 6) NOT NULL,
                actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_rate_limits_actualizado ON seguridad.rate_limits(actualizado_en);
        ";
        $this->pdo->exec($sql);
    }
}
