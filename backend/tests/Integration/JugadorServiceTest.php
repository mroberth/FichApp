<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Env;
use App\Core\Database;
use App\Core\ExcepcionApi;
use App\DTOs\RegistrarJugadorDTO;
use App\DTOs\ActualizarJugadorDTO;
use App\DTOs\AsignarEquipoDTO;
use App\Services\JugadorService;
use App\Repositories\CategoriaRepository;
use App\Repositories\EquipoRepository;
use PDO;
use Exception;

final class JugadorServiceTest extends TestCase
{
    private PDO $db;
    private JugadorService $jugadorService;
    private CategoriaRepository $categoriaRepo;
    private EquipoRepository $equipoRepo;

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

        $this->jugadorService = new JugadorService();
        $this->categoriaRepo  = new CategoriaRepository($this->db);
        $this->equipoRepo     = new EquipoRepository($this->db);
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

    public function testRegistrarJugadorConNuevoRepresentanteYEquipo(): void
    {
        try {
            Database::transaction(function (PDO $pdo) {
                // 1. Crear Academia de prueba
                $stmtAcademia = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Test Fichas') RETURNING id;");
                $stmtAcademia->execute();
                $academiaId = $stmtAcademia->fetchColumn();

                // 2. Crear Categoría y Equipo
                $catId = $this->categoriaRepo->crear($academiaId, [
                    'nombre'    => 'Sub-11',
                    'modalidad' => 'fútbol campo',
                ]);
                $equipoId = $this->equipoRepo->crear($academiaId, [
                    'categoria_id' => $catId,
                    'nombre'       => 'Equipo Azul',
                ]);

                // 3. Registrar primer hijo con representante nuevo
                $dtoHijo1 = RegistrarJugadorDTO::desdeArray([
                    'nombres'                => 'Lucas',
                    'apellidos'              => 'Hernández',
                    'fecha_nacimiento'       => '2015-02-14',
                    'cedula'                 => 'V-36001001',
                    'sexo'                   => 'M',
                    'ficha_medica'           => ['alergias' => ['polen']],
                    'representante_nombres'  => 'Manuel',
                    'representante_apellidos'=> 'Hernández',
                    'representante_telefono' => '+58 412 1119999',
                    'representante_cedula'   => 'V-15001001',
                    'tipo_relacion'          => 'padre',
                    'es_contacto_principal'  => true,
                    'equipo_id'              => $equipoId,
                    'temporada'              => '2026',
                    'numero_camiseta'        => 8,
                    'posicion'               => 'Volante',
                ]);

                $ficha1 = $this->jugadorService->registrarJugador($academiaId, $dtoHijo1);

                $this->assertNotEmpty($ficha1['id']);
                $this->assertSame('Lucas', $ficha1['nombres']);
                $this->assertSame('V-36001001', $ficha1['cedula']);
                $this->assertCount(1, $ficha1['representantes']);
                $this->assertSame('Manuel', $ficha1['representantes'][0]['nombres']);
                $repId = $ficha1['representantes'][0]['representante_id'];
                $this->assertNotEmpty($repId);

                // 4. Registrar segundo hijo (hermano) usando la misma cédula de representante
                // Debe reutilizar al representante sin duplicarlo
                $dtoHijo2 = RegistrarJugadorDTO::desdeArray([
                    'nombres'                => 'Diego',
                    'apellidos'              => 'Hernández',
                    'fecha_nacimiento'       => '2017-09-20',
                    'cedula'                 => 'V-37001002',
                    'sexo'                   => 'M',
                    'representante_nombres'  => 'Manuel',
                    'representante_apellidos'=> 'Hernández',
                    'representante_telefono' => '+58 412 1119999',
                    'representante_cedula'   => 'V-15001001', // Misma cédula
                    'tipo_relacion'          => 'padre',
                ]);

                $ficha2 = $this->jugadorService->registrarJugador($academiaId, $dtoHijo2);

                $this->assertNotEmpty($ficha2['id']);
                $this->assertNotSame($ficha1['id'], $ficha2['id']);
                $this->assertCount(1, $ficha2['representantes']);
                // Debe compartir exactamente el mismo representante_id
                $this->assertSame($repId, $ficha2['representantes'][0]['representante_id']);

                // 5. Verificar listado y búsqueda
                $listado = $this->jugadorService->listar($academiaId, ['busqueda' => 'hernández']);
                $this->assertSame(2, $listado['total']);
                $this->assertCount(2, $listado['items']);

                // 6. Actualizar ficha
                $dtoAct = ActualizarJugadorDTO::desdeArray([
                    'nombres' => 'Lucas Gabriel',
                ]);
                $fichaActualizada = $this->jugadorService->actualizar($ficha1['id'], $academiaId, $dtoAct);
                $this->assertSame('Lucas Gabriel', $fichaActualizada['nombres']);

                // 7. Borrado lógico (soft-delete)
                $eliminado = $this->jugadorService->eliminar($ficha2['id'], $academiaId);
                $this->assertTrue($eliminado);

                // Tras soft-delete, el listado solo debe contener 1 atleta activo
                $listadoPostDelete = $this->jugadorService->listar($academiaId);
                $this->assertSame(1, $listadoPostDelete['total']);

                throw new Exception('Rollback test jugador service');
            });
        } catch (Exception $e) {
            $this->assertSame('Rollback test jugador service', $e->getMessage());
        }
    }

    public function testAislamientoMultiTenantEnJugador(): void
    {
        $this->expectException(ExcepcionApi::class);

        Database::transaction(function (PDO $pdo) {
            // Crear 2 academias distintas
            $stmt1 = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia A') RETURNING id;");
            $stmt1->execute();
            $aid1 = $stmt1->fetchColumn();

            $stmt2 = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia B') RETURNING id;");
            $stmt2->execute();
            $aid2 = $stmt2->fetchColumn();

            $dto = RegistrarJugadorDTO::desdeArray([
                'nombres'                => 'Carlos',
                'apellidos'              => 'Mora',
                'representante_nombres'  => 'Pedro',
                'representante_apellidos'=> 'Mora',
                'representante_telefono' => '+58 414 0001122',
            ]);

            $ficha = $this->jugadorService->registrarJugador($aid1, $dto);

            // Intentar consultar el jugador desde Academia B debe lanzar ExcepcionApi (no encontrado)
            $this->jugadorService->obtenerFicha($ficha['id'], $aid2);
        });
    }
}
