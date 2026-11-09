<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Depends;
use PDO;
use App\Core\Env;
use App\Core\Database;
use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\ErrorCodes;
use App\DTOs\LoginDTO;
use App\Services\AuthService;
use App\Middlewares\AuthMiddleware;

final class AuthServiceTest extends TestCase
{
    private PDO $pdo;
    private AuthService $authService;
    private string $academiaId;

    protected function setUp(): void
    {
        Env::load(__DIR__ . '/../../.env');
        $_ENV['DB_DATABASE'] = 'fichapp_db';
        $_ENV['DB_CONNECTION'] = 'pgsql';

        Database::setConnection(null);
        $this->pdo = Database::getConnection();
        $this->authService = new AuthService();

        Auth::limpiar();
        ContextoTenant::limpiar();
        unset($_SERVER['HTTP_AUTHORIZATION']);

        // Obtener la academia de prueba
        $stmt = $this->pdo->query("SELECT id FROM negocio.academias WHERE nombre = 'Obelisco FC' LIMIT 1");
        $this->academiaId = (string)$stmt->fetchColumn();
        $this->assertNotEmpty($this->academiaId, 'La academia Obelisco FC debe existir para ejecutar los tests.');
    }

    protected function tearDown(): void
    {
        Auth::limpiar();
        ContextoTenant::limpiar();
        unset($_SERVER['HTTP_AUTHORIZATION']);
    }

    public function testLoginExitosoConUsuarioYContrasenaValida(): array
    {
        $dto = new LoginDTO(
            identificadorAcceso: 'admin',
            contrasena: 'password123',
            academiaId: $this->academiaId
        );

        $resultado = $this->authService->login($dto, '127.0.0.1', 'PHPUnit Test Agent');

        $this->assertArrayHasKey('token', $resultado);
        $this->assertSame('Bearer', $resultado['tipo']);
        $this->assertNotEmpty($resultado['expira_en']);
        $this->assertSame(64, strlen($resultado['token'])); // 32 bytes en hex = 64 chars

        $usuario = $resultado['usuario'];
        $this->assertSame('admin', $usuario['identificador_acceso']);
        $this->assertSame('administrador', $usuario['rol']);
        $this->assertSame('Obelisco FC', $usuario['academia']['nombre']);

        // Verificar que el token se guardó con hash SHA-256 en la base de datos
        $hashEsperado = hash('sha256', $resultado['token']);
        $stmt = $this->pdo->prepare("SELECT * FROM seguridad.sesiones_tokens WHERE token_hash = :hash");
        $stmt->execute(['hash' => $hashEsperado]);
        $sesionDb = $stmt->fetch();

        $this->assertNotEmpty($sesionDb);
        $this->assertNull($sesionDb['revocado_en']);

        // Verificar que se registró la auditoría
        $auditStmt = $this->pdo->prepare("
            SELECT * FROM seguridad.registros_auditoria 
            WHERE usuario_id = :uid AND accion = 'LOGIN_EXITOSO'
            ORDER BY creado_en DESC LIMIT 1
        ");
        $auditStmt->execute(['uid' => $usuario['id']]);
        $auditoria = $auditStmt->fetch();
        $this->assertNotEmpty($auditoria);

        return $resultado;
    }

    public function testLoginFallaConContrasenaIncorrecta(): void
    {
        $dto = new LoginDTO(
            identificadorAcceso: 'admin',
            contrasena: 'clave_invalida',
            academiaId: $this->academiaId
        );

        $this->expectException(ExcepcionApi::class);

        try {
            $this->authService->login($dto, '127.0.0.1', 'PHPUnit');
        } catch (ExcepcionApi $e) {
            $this->assertSame(401, $e->estado);
            $this->assertSame(ErrorCodes::NO_AUTENTICADO, $e->codigo);
            $this->assertSame('Credenciales de acceso incorrectas.', $e->getMessage());

            // Verificar registro de auditoría de intento fallido
            $stmt = $this->pdo->query("
                SELECT * FROM seguridad.registros_auditoria 
                WHERE accion = 'LOGIN_FALLIDO' 
                ORDER BY creado_en DESC LIMIT 1
            ");
            $auditoria = $stmt->fetch();
            $this->assertNotEmpty($auditoria);

            throw $e;
        }
    }

    public function testLoginFallaConUsuarioInexistente(): void
    {
        $dto = new LoginDTO(
            identificadorAcceso: 'fantasma_inexistente',
            contrasena: 'cualquiera'
        );

        $this->expectException(ExcepcionApi::class);

        try {
            $this->authService->login($dto);
        } catch (ExcepcionApi $e) {
            $this->assertSame(401, $e->estado);
            $this->assertSame(ErrorCodes::NO_AUTENTICADO, $e->codigo);
            $this->assertSame('Credenciales de acceso incorrectas.', $e->getMessage());
            throw $e;
        }
    }

    #[Depends('testLoginExitosoConUsuarioYContrasenaValida')]
    public function testValidarTokenExitoso(array $loginResult): void
    {
        $token = $loginResult['token'];
        $usuario = $this->authService->validarToken($token);

        $this->assertSame('admin', $usuario['identificador_acceso']);
        $this->assertSame('administrador', $usuario['rol']);
        $this->assertSame($this->academiaId, $usuario['academia_id']);
        $this->assertArrayHasKey('sesion', $usuario);
    }

    public function testValidarTokenInvalidoLanzaExcepcion(): void
    {
        $this->expectException(ExcepcionApi::class);

        try {
            $this->authService->validarToken('token_completamente_falso_y_no_existente');
        } catch (ExcepcionApi $e) {
            $this->assertSame(401, $e->estado);
            $this->assertSame(ErrorCodes::NO_AUTENTICADO, $e->codigo);
            throw $e;
        }
    }

    #[Depends('testLoginExitosoConUsuarioYContrasenaValida')]
    public function testLogoutRevocaToken(array $loginResult): void
    {
        $token = $loginResult['token'];

        // 1. Debe ser válido antes de logout
        $validoAntes = $this->authService->validarToken($token);
        $this->assertNotEmpty($validoAntes);

        // 2. Ejecutar logout
        $revocado = $this->authService->logout($token);
        $this->assertTrue($revocado);

        // 3. Validar token nuevamente debe fallar
        $this->expectException(ExcepcionApi::class);
        $this->authService->validarToken($token);
    }

    public function testAuthMiddlewareInicializaContextosConTokenValido(): void
    {
        // 1. Generar token de sesión para entrenador
        $dto = new LoginDTO('entrenador', 'password123');
        $loginResult = $this->authService->login($dto);
        $token = $loginResult['token'];

        // 2. Simular cabecera HTTP Authorization
        $_SERVER['HTTP_AUTHORIZATION'] = "Bearer {$token}";

        AuthMiddleware::manejar();

        $this->assertTrue(Auth::estaAutenticado());
        $this->assertSame('entrenador', Auth::rol());
        $this->assertTrue(Auth::esEntrenador());
        $this->assertFalse(Auth::esAdmin());
        $this->assertSame($this->academiaId, ContextoTenant::getAcademiaId());

        // 3. Verificar exigencia de rol
        AuthMiddleware::exigirRol('entrenador'); // Pasa sin lanzar excepción

        $this->expectException(ExcepcionApi::class);
        try {
            AuthMiddleware::exigirRol('superadmin'); // Debe fallar
        } catch (ExcepcionApi $e) {
            $this->assertSame(403, $e->estado);
            $this->assertSame(ErrorCodes::ACCESO_DENEGADO, $e->codigo);
            throw $e;
        }
    }
}
