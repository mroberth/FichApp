<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Env;
use App\Core\Database;
use PDO;
use Exception;

final class DatabasePostgresTest extends TestCase
{
    private PDO $db;

    protected function setUp(): void
    {
        Env::load(__DIR__ . '/../../.env');

        if (!extension_loaded('pdo_pgsql')) {
            $this->markTestSkipped('pdo_pgsql no cargada');
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
            $this->markTestSkipped('Error conexion: ' . $e->getMessage());
        }
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

    public function testPuedeCrearAcademiaYUsuarioConClaveForaneaCruzada(): void
    {
        try {
            Database::transaction(function (PDO $pdo) {
                // 1. Crear academia de prueba en negocio
                $stmtAcademia = $pdo->prepare("
                    INSERT INTO negocio.academias (nombre, rif, zona_horaria)
                    VALUES ('Academia Test FichApp', 'J-123456789', 'America/Caracas')
                    RETURNING id;
                ");
                $stmtAcademia->execute();
                $academiaId = $stmtAcademia->fetchColumn();

                $this->assertNotEmpty($academiaId);

                // 2. Crear usuario administrador en seguridad asociado a la academia
                $stmtUsuario = $pdo->prepare("
                    INSERT INTO seguridad.usuarios (academia_id, nombre, identificador_acceso, contrasena_hash, rol)
                    VALUES (:academia_id, 'Admin Prueba', 'admin_test', 'hash_secreto', 'administrador')
                    RETURNING id;
                ");
                $stmtUsuario->execute(['academia_id' => $academiaId]);
                $usuarioId = $stmtUsuario->fetchColumn();

                $this->assertNotEmpty($usuarioId);

                // 3. Verificar que se puede consultar con JOIN entre ambos esquemas
                $stmtJoin = $pdo->prepare("
                    SELECT u.nombre as usuario, a.nombre as academia, u.rol
                    FROM seguridad.usuarios u
                    JOIN negocio.academias a ON a.id = u.academia_id
                    WHERE u.id = :usuario_id
                ");
                $stmtJoin->execute(['usuario_id' => $usuarioId]);
                $datos = $stmtJoin->fetch(PDO::FETCH_ASSOC);

                $this->assertSame('Admin Prueba', $datos['usuario']);
                $this->assertSame('Academia Test FichApp', $datos['academia']);
                $this->assertSame('administrador', $datos['rol']);

                // 4. Rollback intencional para no ensuciar la base de datos
                throw new Exception('Rollback intencional');
            });
        } catch (Exception $e) {
            $this->assertSame('Rollback intencional', $e->getMessage());
        }
    }

    public function testRestriccionUnicidadDeUsuarioPorAcademia(): void
    {
        $this->expectException(\PDOException::class);

        Database::transaction(function (PDO $pdo) {
            $stmtAcademia = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Unicidad') RETURNING id;");
            $stmtAcademia->execute();
            $academiaId = $stmtAcademia->fetchColumn();

            $stmtUsuario = $pdo->prepare("
                INSERT INTO seguridad.usuarios (academia_id, nombre, identificador_acceso, contrasena_hash, rol)
                VALUES (:academia_id, 'User 1', 'mismo_usuario', 'hash', 'entrenador')
            ");
            $stmtUsuario->execute(['academia_id' => $academiaId]);

            // Intentar insertar mismo identificador en la misma academia debe fallar (uq_usuario_acceso_academia)
            $stmtDuplicado = $pdo->prepare("
                INSERT INTO seguridad.usuarios (academia_id, nombre, identificador_acceso, contrasena_hash, rol)
                VALUES (:academia_id, 'User 2', 'mismo_usuario', 'hash', 'entrenador')
            ");
            $stmtDuplicado->execute(['academia_id' => $academiaId]);
        });
    }
}
