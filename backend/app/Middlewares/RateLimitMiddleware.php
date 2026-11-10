<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\ExcepcionApi;
use App\Services\TokenBucketLimiter;

/**
 * Middleware para aplicar Rate Limiting usando Token Bucket.
 */
final class RateLimitMiddleware
{
    private static ?TokenBucketLimiter $limiter = null;

    public static function setLimiter(?TokenBucketLimiter $limiter): void
    {
        self::$limiter = $limiter;
    }

    private static function getLimiter(): TokenBucketLimiter
    {
        return self::$limiter ?? new TokenBucketLimiter();
    }

    /**
     * Aplica la verificación del Token Bucket para una clave dada.
     *
     * @param string $accion Prefijo de la acción (ej: 'login')
     * @param string $identificador IP, usuario o clave compuesta
     * @param int $capacidad Ráfaga máxima de peticiones (ej: 5)
     * @param float $tasaRecargaPorSegundo Tasa de reposición (ej: 5 tokens / 900s = 0.0055 tok/s)
     * @throws ExcepcionApi Con código HTTP 429 si se excede la tasa
     */
    public static function verificar(
        string $accion,
        string $identificador,
        int $capacidad = 5,
        float $tasaRecargaPorSegundo = 0.0055 // ~5 tokens cada 15 minutos
    ): void {
        $clave = "{$accion}:" . hash('sha256', trim($identificador));
        $resultado = self::getLimiter()->consumir($clave, $capacidad, $tasaRecargaPorSegundo);

        // Cabeceras HTTP estándar de Rate Limit
        if (!headers_sent()) {
            header("X-RateLimit-Limit: {$capacidad}");
            header("X-RateLimit-Remaining: {$resultado['restantes']}");
        }

        if (!$resultado['permitido']) {
            if (!headers_sent()) {
                header("Retry-After: {$resultado['reintento_en']}");
            }

            $minutos = (int)ceil($resultado['reintento_en'] / 60);
            throw ExcepcionApi::demasiadasPeticiones(
                "Has excedido el límite de intentos permitidos. Por favor espera {$minutos} minuto(s) antes de reintentar.",
                [
                    'reintento_en_segundos' => $resultado['reintento_en'],
                    'limite_maximo'         => $capacidad,
                ]
            );
        }
    }
}
