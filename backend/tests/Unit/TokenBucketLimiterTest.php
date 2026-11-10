<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\ExcepcionApi;
use App\Services\TokenBucketLimiter;
use App\Middlewares\RateLimitMiddleware;
use PDO;

class TokenBucketLimiterTest extends TestCase
{
    private PDO $pdo;
    private TokenBucketLimiter $limiter;

    protected function setUp(): void
    {
        // Usar SQLite en memoria para tests unitarios rápidos e independientes
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Crear tabla compatible para testing
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS rate_limits (
                clave TEXT PRIMARY KEY,
                tokens REAL NOT NULL,
                ultima_recarga REAL NOT NULL,
                actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP
            );
        ");

        // TokenBucketLimiter que usa la conexión de test
        $this->limiter = new class($this->pdo) extends TokenBucketLimiter {
            private PDO $testPdo;
            public function __construct(PDO $pdo) {
                $this->testPdo = $pdo;
            }
            public function consumir(string $clave, int $capacidad, float $tasaRecargaPorSegundo, int $costo = 1): array {
                $ahora = microtime(true);
                $stmt = $this->testPdo->prepare("SELECT tokens, ultima_recarga FROM rate_limits WHERE clave = :clave");
                $stmt->execute(['clave' => $clave]);
                $fila = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$fila) {
                    $tokensDisponibles = (float)$capacidad;
                    $ultimaRecarga = $ahora;
                } else {
                    $tokensActuales = (float)$fila['tokens'];
                    $ultimaRecarga = (float)$fila['ultima_recarga'];
                    $tiempoTranscurrido = max(0.0, $ahora - $ultimaRecarga);
                    $tokensRegenerados = $tiempoTranscurrido * $tasaRecargaPorSegundo;
                    $tokensDisponibles = min((float)$capacidad, $tokensActuales + $tokensRegenerados);
                }

                if ($tokensDisponibles >= $costo) {
                    $nuevosTokens = $tokensDisponibles - $costo;
                    $ins = $this->testPdo->prepare("
                        INSERT INTO rate_limits (clave, tokens, ultima_recarga) VALUES (:clave, :tokens, :ahora)
                        ON CONFLICT(clave) DO UPDATE SET tokens = :tokens, ultima_recarga = :ahora
                    ");
                    $ins->execute(['clave' => $clave, 'tokens' => $nuevosTokens, 'ahora' => $ahora]);
                    return ['permitido' => true, 'restantes' => (int)floor($nuevosTokens), 'reintento_en' => 0];
                }

                $tokensFaltantes = $costo - $tokensDisponibles;
                $segundosEspera = (int)ceil($tokensFaltantes / $tasaRecargaPorSegundo);
                return ['permitido' => false, 'restantes' => 0, 'reintento_en' => max(1, $segundosEspera)];
            }
        };

        RateLimitMiddleware::setLimiter($this->limiter);
    }

    protected function tearDown(): void
    {
        RateLimitMiddleware::setLimiter(null);
    }

    public function testPermitePeticionesHastaAgotarCapacidad(): void
    {
        $clave = 'test_user_ip_1';

        // Capacidad 3 peticiones
        for ($i = 0; $i < 3; $i++) {
            RateLimitMiddleware::verificar('test', $clave, 3, 0.1);
        }

        // La 4ta petición debe lanzar ExcepcionApi 429
        $this->expectException(ExcepcionApi::class);
        $this->expectExceptionCode(0);

        try {
            RateLimitMiddleware::verificar('test', $clave, 3, 0.1);
        } catch (ExcepcionApi $e) {
            $this->assertSame(429, $e->estado);
            $this->assertSame('TOO_MANY_REQUESTS', $e->codigo);
            throw $e;
        }
    }

    public function testClavesDiferentesTienenBucketsIndependientes(): void
    {
        $claveA = 'ip_192_168_1_10';
        $claveB = 'ip_192_168_1_20';

        // Agotar bucket A
        for ($i = 0; $i < 2; $i++) {
            RateLimitMiddleware::verificar('test', $claveA, 2, 0.1);
        }

        // Clave B todavía debe tener disponibilidad
        RateLimitMiddleware::verificar('test', $claveB, 2, 0.1);
        $this->assertTrue(true);
    }
}
