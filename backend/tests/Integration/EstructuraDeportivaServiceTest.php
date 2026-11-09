<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Env;
use App\Core\Database;
use App\Core\ExcepcionApi;
use App\Services\EstructuraDeportivaService;
use PDO;
use Exception;

final class EstructuraDeportivaServiceTest extends TestCase
{
    private PDO $db;
    private EstructuraDeportivaService $estructuraService;

    protected function setUp(): void
    {
        Env::load(__DIR__ . '/../../.env');

        if (!extension_loaded('pdo_pgsql')) {
            $this->markTestSkipped('pdo_pgsql no está disponible');
        }

        $_ENV['DB_CONNECTION'] = 'pgsql';
        $_SERVER['DB_CONNECTION'] = 'pgsql';
        $_ENV['DB_DATABASE'] = 'fichapp_db';
        $_SERVER['DB_DATABASE'] = 'fichapp_db';
        putenv('DB_CONNECTION=pgsql');
        Database::setConnection(null);

        try {
            $this->db = Database::getConnection();
        } catch (\Throwable $e) {
            $this->markTestSkipped('Error de conexión a PostgreSQL: ' . $e->getMessage());
        }

        $this->estructuraService = new EstructuraDeportivaService();
    }

    protected function tearDown(): void
    {
        $_ENV['DB_CONNECTION'] = 'sqlite';
        $_SERVER['DB_CONNECTION'] = 'sqlite';
        $_ENV['DB_DATABASE'] = ':memory:';
        $_SERVER['DB_DATABASE'] = ':memory:';
        putenv('DB_CONNECTION=sqlite');
        Database::setConnection(null);
    }

    public function testCreacionDeCategoriasEquiposYAsignacionDeEntrenador(): void
    {
        try {
            Database::transaction(function (PDO $pdo) {
                // 1. Academia
                $stmt = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Estructura') RETURNING id;");
                $stmt->execute();
                $academiaId = $stmt->fetchColumn();

                // 2. Crear Categoría
                $cat = $this->estructuraService->crearCategoria($academiaId, [
                    'nombre'      => 'Sub-13',
                    'modalidad'   => 'fútbol campo',
                    'edad_minima' => 11,
                    'edad_maxima' => 13,
                ]);
                $this->assertNotEmpty($cat['id']);
                $this->assertSame('Sub-13', $cat['nombre']);

                // 3. Crear Equipo en la categoría
                $equipo = $this->estructuraService->crearEquipo($academiaId, [
                    'nombre'       => 'Plantel A',
                    'categoria_id' => $cat['id'],
                ]);
                $this->assertNotEmpty($equipo['id']);
                $this->assertSame('Plantel A', $equipo['nombre']);

                // 4. Crear Usuario Entrenador
                $stmtUser = $pdo->prepare("
                    INSERT INTO seguridad.usuarios (academia_id, nombre, identificador_acceso, contrasena_hash, rol)
                    VALUES (:aid, 'Prof. Castillo', 'castillo_entrenador', 'hash', 'entrenador')
                    RETURNING id;
                ");
                $stmtUser->execute(['aid' => $academiaId]);
                $entrenadorId = $stmtUser->fetchColumn();

                // 5. Asignar Entrenador al Equipo
                $asig = $this->estructuraService->asignarEntrenador(
                    $academiaId,
                    $equipo['id'],
                    $entrenadorId,
                    'principal'
                );
                $this->assertSame('principal', $asig['rol_en_equipo']);
                $this->assertSame('Prof. Castillo', $asig['entrenador_nombre']);

                // 6. Consultar entrenadores del equipo
                $entrenadores = $this->estructuraService->obtenerEntrenadoresDeEquipo($equipo['id'], $academiaId);
                $this->assertCount(1, $entrenadores);
                $this->assertSame('Prof. Castillo', $entrenadores[0]['entrenador_nombre']);

                throw new Exception('Rollback test estructura');
            });
        } catch (Exception $e) {
            $this->assertSame('Rollback test estructura', $e->getMessage());
        }
    }

    public function testFallaAlDuplicarNombreDeCategoria(): void
    {
        $this->expectException(ExcepcionApi::class);

        Database::transaction(function (PDO $pdo) {
            $stmt = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Cat Dup') RETURNING id;");
            $stmt->execute();
            $aid = $stmt->fetchColumn();

            $this->estructuraService->crearCategoria($aid, ['nombre' => 'Sub-9']);
            // Mismo nombre debe lanzar ExcepcionApi
            $this->estructuraService->crearCategoria($aid, ['nombre' => 'Sub-9']);
        });
    }
}
