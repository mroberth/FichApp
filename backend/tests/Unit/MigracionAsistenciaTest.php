<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use PDO;

final class MigracionAsistenciaTest extends TestCase
{
    private PDO $pdo;

    protected function setUp(): void
    {
        // Usar SQLite en memoria para validar la lógica del esquema y las restricciones
        $this->pdo = new PDO('sqlite::memory:');
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Crear tablas maestras simuladas
        $this->pdo->exec("
            CREATE TABLE academias (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL
            );
            CREATE TABLE usuarios (
                id TEXT PRIMARY KEY,
                academia_id TEXT NOT NULL,
                nombre TEXT NOT NULL
            );
            CREATE TABLE equipos (
                id TEXT PRIMARY KEY,
                academia_id TEXT NOT NULL,
                nombre TEXT NOT NULL
            );
            CREATE TABLE jugadores (
                id TEXT PRIMARY KEY,
                academia_id TEXT NOT NULL,
                nombres TEXT NOT NULL,
                apellidos TEXT NOT NULL
            );
        ");

        // Crear tablas de asistencia adaptadas para SQLite (emulando PostgreSQL)
        $this->pdo->exec("
            CREATE TABLE sesiones_asistencia (
                id TEXT PRIMARY KEY,
                academia_id TEXT NOT NULL REFERENCES academias(id),
                equipo_id TEXT NOT NULL REFERENCES equipos(id),
                fecha_sesion TEXT NOT NULL,
                lugar TEXT,
                observaciones TEXT,
                creado_por TEXT NOT NULL REFERENCES usuarios(id),
                sincronizado_en TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE registros_asistencia (
                id TEXT PRIMARY KEY,
                academia_id TEXT NOT NULL REFERENCES academias(id),
                sesion_id TEXT NOT NULL REFERENCES sesiones_asistencia(id) ON DELETE CASCADE,
                jugador_id TEXT NOT NULL REFERENCES jugadores(id),
                estado_asistencia TEXT NOT NULL CHECK (estado_asistencia IN ('presente', 'ausente', 'justificado')),
                observaciones TEXT,
                creado_en TEXT DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uq_asistencia_jugador_sesion UNIQUE (sesion_id, jugador_id)
            );
        ");
    }

    public function testPuedeCrearSesionYRegistrosConUuids(): void
    {
        $academiaId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        $usuarioId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
        $equipoId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
        $jugador1Id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
        $jugador2Id = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

        // Población base
        $this->pdo->exec("INSERT INTO academias (id, nombre) VALUES ('{$academiaId}', 'Obelisco FC')");
        $this->pdo->exec("INSERT INTO usuarios (id, academia_id, nombre) VALUES ('{$usuarioId}', '{$academiaId}', 'Profesor')");
        $this->pdo->exec("INSERT INTO equipos (id, academia_id, nombre) VALUES ('{$equipoId}', '{$academiaId}', 'Sub-15 A')");
        $this->pdo->exec("INSERT INTO jugadores (id, academia_id, nombres, apellidos) VALUES ('{$jugador1Id}', '{$academiaId}', 'Juan', 'Pérez')");
        $this->pdo->exec("INSERT INTO jugadores (id, academia_id, nombres, apellidos) VALUES ('{$jugador2Id}', '{$academiaId}', 'Carlos', 'Gómez')");

        // 1. Insertar Sesión creada offline en móvil
        $sesionId = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
        $stmtSesion = $this->pdo->prepare("
            INSERT INTO sesiones_asistencia (id, academia_id, equipo_id, fecha_sesion, lugar, observaciones, creado_por)
            VALUES (:id, :academia_id, :equipo_id, :fecha_sesion, :lugar, :observaciones, :creado_por)
        ");
        $stmtSesion->execute([
            'id' => $sesionId,
            'academia_id' => $academiaId,
            'equipo_id' => $equipoId,
            'fecha_sesion' => '2026-11-10T16:00:00Z',
            'lugar' => 'Cancha Principal Obelisco',
            'observaciones' => 'Entrenamiento táctico',
            'creado_por' => $usuarioId,
        ]);

        // 2. Insertar Registros de Asistencia
        $reg1Id = '11eebc99-9c0b-4ef8-bb6d-6bb9bd380a77';
        $reg2Id = '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a88';

        $stmtReg = $this->pdo->prepare("
            INSERT INTO registros_asistencia (id, academia_id, sesion_id, jugador_id, estado_asistencia, observaciones)
            VALUES (:id, :academia_id, :sesion_id, :jugador_id, :estado, :obs)
        ");
        $stmtReg->execute([
            'id' => $reg1Id,
            'academia_id' => $academiaId,
            'sesion_id' => $sesionId,
            'jugador_id' => $jugador1Id,
            'estado' => 'presente',
            'obs' => 'A tiempo',
        ]);
        $stmtReg->execute([
            'id' => $reg2Id,
            'academia_id' => $academiaId,
            'sesion_id' => $sesionId,
            'jugador_id' => $jugador2Id,
            'estado' => 'ausente',
            'obs' => 'Sin aviso',
        ]);

        $cuenta = (int)$this->pdo->query("SELECT COUNT(*) FROM registros_asistencia WHERE sesion_id = '{$sesionId}'")->fetchColumn();
        $this->assertSame(2, $cuenta);
    }

    public function testRestriccionUnicidadEvitaDuplicadosDeJugadorPorSesion(): void
    {
        $this->expectException(\PDOException::class);

        $academiaId = 'a1';
        $sesionId = 's1';
        $jugadorId = 'j1';

        $stmt = $this->pdo->prepare("
            INSERT INTO registros_asistencia (id, academia_id, sesion_id, jugador_id, estado_asistencia)
            VALUES (:id, :academia_id, :sesion_id, :jugador_id, :estado)
        ");

        $stmt->execute(['id' => 'r1', 'academia_id' => $academiaId, 'sesion_id' => $sesionId, 'jugador_id' => $jugadorId, 'estado' => 'presente']);
        // Intento duplicar el mismo jugador en la misma sesión
        $stmt->execute(['id' => 'r2', 'academia_id' => $academiaId, 'sesion_id' => $sesionId, 'jugador_id' => $jugadorId, 'estado' => 'ausente']);
    }

    public function testRestriccionCheckEstadoAsistenciaValido(): void
    {
        $this->expectException(\PDOException::class);

        $stmt = $this->pdo->prepare("
            INSERT INTO registros_asistencia (id, academia_id, sesion_id, jugador_id, estado_asistencia)
            VALUES (:id, :academia_id, :sesion_id, :jugador_id, :estado)
        ");

        // Estado no permitido
        $stmt->execute(['id' => 'r1', 'academia_id' => 'a1', 'sesion_id' => 's1', 'jugador_id' => 'j1', 'estado' => 'tarde']);
    }
}
