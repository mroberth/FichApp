<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use PDO;
use App\Core\Env;
use App\Core\Database;
use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\DTOs\LoginDTO;
use App\Services\AuthService;
use App\Controllers\EstructuraDeportivaController;
use App\Controllers\JugadorController;
use App\Controllers\FamiliaController;

final class EndpointsDeportivosTest extends TestCase
{
    private PDO $pdo;
    private string $academiaId;
    private string $tokenAdmin;

    protected function setUp(): void
    {
        Env::load(__DIR__ . '/../../.env');
        $_ENV['DB_DATABASE'] = 'fichapp_db';
        $_ENV['DB_CONNECTION'] = 'pgsql';

        Database::setConnection(null);
        $this->pdo = Database::getConnection();

        Auth::limpiar();
        ContextoTenant::limpiar();
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $_GET = [];

        // Obtener la academia de prueba Obelisco FC
        $stmt = $this->pdo->query("SELECT id FROM negocio.academias WHERE nombre = 'Obelisco FC' LIMIT 1");
        $this->academiaId = (string)$stmt->fetchColumn();
        $this->assertNotEmpty($this->academiaId, 'La academia Obelisco FC debe existir para ejecutar los tests.');

        // Autenticar al usuario administrador para obtener token Bearer
        $authService = new AuthService();
        $loginDto = new LoginDTO('admin', 'password123', $this->academiaId);
        $resp = $authService->login($loginDto);
        $this->tokenAdmin = $resp['token'];

        $_SERVER['HTTP_AUTHORIZATION'] = "Bearer {$this->tokenAdmin}";
    }

    protected function tearDown(): void
    {
        Auth::limpiar();
        ContextoTenant::limpiar();
        unset($_SERVER['HTTP_AUTHORIZATION']);
        $_GET = [];
    }

    public function testListarCategoriasConTokenAutenticado(): void
    {
        ob_start();
        EstructuraDeportivaController::listarCategorias();
        $salida = ob_get_clean();

        $json = json_decode($salida ?: '{}', true);

        $this->assertTrue($json['exito'] ?? false);
        $this->assertIsArray($json['datos']);
        $nombres = array_column($json['datos'], 'nombre');
        $this->assertContains('Sub-10', $nombres);
        $this->assertContains('Sub-12', $nombres);
    }

    public function testListarEquiposConTokenAutenticado(): void
    {
        ob_start();
        EstructuraDeportivaController::listarEquipos();
        $salida = ob_get_clean();

        $json = json_decode($salida ?: '{}', true);

        $this->assertTrue($json['exito'] ?? false);
        $this->assertIsArray($json['datos']);
        $nombres = array_column($json['datos'], 'nombre');
        $this->assertContains('Obelisco FC Sub-12 A', $nombres);
    }

    public function testListarJugadoresConFiltroYBusqueda(): void
    {
        $_GET['busqueda'] = 'Pérez';

        ob_start();
        JugadorController::listar();
        $salida = ob_get_clean();

        $json = json_decode($salida ?: '{}', true);

        $this->assertTrue($json['exito'] ?? false);
        $this->assertGreaterThanOrEqual(2, $json['datos']['total']);

        $nombres = array_column($json['datos']['items'], 'nombres');
        $this->assertContains('Santiago', $nombres);
        $this->assertContains('Mateo', $nombres);
    }

    public function testObtenerFichaJugador(): void
    {
        $stmt = $this->pdo->prepare("SELECT id FROM negocio.jugadores WHERE academia_id = :aid AND nombres = 'Santiago' LIMIT 1");
        $stmt->execute(['aid' => $this->academiaId]);
        $jugadorId = (string)$stmt->fetchColumn();

        $this->assertNotEmpty($jugadorId);

        ob_start();
        JugadorController::obtener($jugadorId);
        $salida = ob_get_clean();

        $json = json_decode($salida ?: '{}', true);

        $this->assertTrue($json['exito'] ?? false);
        $this->assertSame('Santiago', $json['datos']['nombres']);
        $this->assertSame('Pérez', $json['datos']['apellidos']);
        $this->assertNotEmpty($json['datos']['representantes']);
        $this->assertSame('Carlos', $json['datos']['representantes'][0]['nombres']);
    }

    public function testObtenerGrupoFamiliarDeRepresentante(): void
    {
        $stmt = $this->pdo->prepare("SELECT id FROM negocio.representantes WHERE academia_id = :aid AND cedula = 'V-14234567' LIMIT 1");
        $stmt->execute(['aid' => $this->academiaId]);
        $repId = (string)$stmt->fetchColumn();

        $this->assertNotEmpty($repId);

        ob_start();
        FamiliaController::obtenerGrupoFamiliar($repId);
        $salida = ob_get_clean();

        $json = json_decode($salida ?: '{}', true);

        $this->assertTrue($json['exito'] ?? false);
        $this->assertSame('Carlos', $json['datos']['nombres']);
        $this->assertSame('Pérez', $json['datos']['apellidos']);
        $this->assertSame(2, $json['datos']['total_hijos']);
        $this->assertCount(2, $json['datos']['hijos']);
    }

    public function testPeticionSinTokenLanzaExcepcion401(): void
    {
        unset($_SERVER['HTTP_AUTHORIZATION']);
        Auth::limpiar();
        ContextoTenant::limpiar();

        $this->expectException(ExcepcionApi::class);

        try {
            EstructuraDeportivaController::listarCategorias();
        } catch (ExcepcionApi $e) {
            $this->assertSame(401, $e->estado);
            throw $e;
        }
    }
}
