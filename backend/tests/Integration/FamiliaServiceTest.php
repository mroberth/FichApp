<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Env;
use App\Core\Database;
use App\Core\ExcepcionApi;
use App\DTOs\CrearRepresentanteDTO;
use App\DTOs\RegistrarJugadorDTO;
use App\Services\FamiliaService;
use App\Services\JugadorService;
use PDO;
use Exception;

final class FamiliaServiceTest extends TestCase
{
    private PDO $db;
    private FamiliaService $familiaService;
    private JugadorService $jugadorService;

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

        $this->familiaService = new FamiliaService();
        $this->jugadorService = new JugadorService();
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

    public function testGestionDeGrupoFamiliarMultihijo(): void
    {
        try {
            Database::transaction(function (PDO $pdo) {
                // 1. Academia
                $stmt = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Familias') RETURNING id;");
                $stmt->execute();
                $academiaId = $stmt->fetchColumn();

                // 2. Crear tutor/representante
                $dtoRep = CrearRepresentanteDTO::desdeArray([
                    'nombres'   => 'María',
                    'apellidos' => 'García',
                    'cedula'    => 'V-18999888',
                    'telefono'  => '+58 412 8887766',
                    'correo'    => 'maria.garcia@example.com',
                ]);
                $rep = $this->familiaService->crearRepresentante($academiaId, $dtoRep);
                $this->assertNotEmpty($rep['id']);
                $this->assertSame('María', $rep['nombres']);

                // 3. Registrar dos hijos asociados a este representante
                $dtoHijo1 = RegistrarJugadorDTO::desdeArray([
                    'nombres'          => 'Andrés',
                    'apellidos'        => 'García',
                    'representante_id' => $rep['id'],
                    'tipo_relacion'    => 'madre',
                ]);
                $this->jugadorService->registrarJugador($academiaId, $dtoHijo1);

                $dtoHijo2 = RegistrarJugadorDTO::desdeArray([
                    'nombres'          => 'Camila',
                    'apellidos'        => 'García',
                    'representante_id' => $rep['id'],
                    'tipo_relacion'    => 'madre',
                ]);
                $this->jugadorService->registrarJugador($academiaId, $dtoHijo2);

                // 4. Consultar grupo familiar completo
                $grupo = $this->familiaService->obtenerGrupoFamiliar($rep['id'], $academiaId);

                $this->assertSame('María', $grupo['nombres']);
                $this->assertSame(2, $grupo['total_hijos']);
                $this->assertCount(2, $grupo['hijos']);

                $nombresHijos = array_column($grupo['hijos'], 'nombres');
                $this->assertContains('Andrés', $nombresHijos);
                $this->assertContains('Camila', $nombresHijos);

                // 5. Búsqueda de representantes
                $resultados = $this->familiaService->buscar($academiaId, '18999888');
                $this->assertCount(1, $resultados);
                $this->assertSame('María', $resultados[0]['nombres']);
                $this->assertSame(2, $resultados[0]['total_hijos']);

                throw new Exception('Rollback test familia');
            });
        } catch (Exception $e) {
            $this->assertSame('Rollback test familia', $e->getMessage());
        }
    }

    public function testFallaAlDuplicarCedulaDeRepresentante(): void
    {
        $this->expectException(ExcepcionApi::class);

        Database::transaction(function (PDO $pdo) {
            $stmt = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Cedula Rep') RETURNING id;");
            $stmt->execute();
            $academiaId = $stmt->fetchColumn();

            $dto1 = CrearRepresentanteDTO::desdeArray([
                'nombres'   => 'Pedro',
                'apellidos' => 'Soto',
                'cedula'    => 'V-11223344',
                'telefono'  => '+58 414 1111111',
            ]);
            $this->familiaService->crearRepresentante($academiaId, $dto1);

            // Mismo representante con misma cédula debe lanzar ExcepcionApi
            $dto2 = CrearRepresentanteDTO::desdeArray([
                'nombres'   => 'Pedro José',
                'apellidos' => 'Soto',
                'cedula'    => 'V-11223344',
                'telefono'  => '+58 414 2222222',
            ]);
            $this->familiaService->crearRepresentante($academiaId, $dto2);
        });
    }
}
