<?php

declare(strict_types=1);

namespace App\Tests\Integration;

use PHPUnit\Framework\TestCase;
use App\Core\Env;
use App\Core\Database;
use PDO;
use Exception;
use PDOException;

final class TablasDeportivasTest extends TestCase
{
    private PDO $db;

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

    public function testCreacionDeEstructuraDeportivaYRelacionesCompletas(): void
    {
        try {
            Database::transaction(function (PDO $pdo) {
                // 1. Academia
                $stmtAcademia = $pdo->prepare("
                    INSERT INTO negocio.academias (nombre, rif, zona_horaria)
                    VALUES ('Academia Deportiva Central', 'J-99887766-5', 'America/Caracas')
                    RETURNING id;
                ");
                $stmtAcademia->execute();
                $academiaId = $stmtAcademia->fetchColumn();
                $this->assertNotEmpty($academiaId);

                // 2. Categoría
                $stmtCat = $pdo->prepare("
                    INSERT INTO negocio.categorias (academia_id, nombre, modalidad, edad_minima, edad_maxima)
                    VALUES (:aid, 'Sub-12', 'fútbol campo', 10, 12)
                    RETURNING id;
                ");
                $stmtCat->execute(['aid' => $academiaId]);
                $catId = $stmtCat->fetchColumn();
                $this->assertNotEmpty($catId);

                // 3. Equipo
                $stmtEquipo = $pdo->prepare("
                    INSERT INTO negocio.equipos (academia_id, categoria_id, nombre)
                    VALUES (:aid, :cid, 'Equipo Titular')
                    RETURNING id;
                ");
                $stmtEquipo->execute(['aid' => $academiaId, 'cid' => $catId]);
                $equipoId = $stmtEquipo->fetchColumn();
                $this->assertNotEmpty($equipoId);

                // 4. Entrenador (usuario) y asignación
                $stmtCoach = $pdo->prepare("
                    INSERT INTO seguridad.usuarios (academia_id, nombre, identificador_acceso, contrasena_hash, rol)
                    VALUES (:aid, 'Prof. Martínez', 'coach_martinez', 'hash_pwd', 'entrenador')
                    RETURNING id;
                ");
                $stmtCoach->execute(['aid' => $academiaId]);
                $coachId = $stmtCoach->fetchColumn();

                $stmtAsigCoach = $pdo->prepare("
                    INSERT INTO negocio.asignaciones_entrenadores_equipos (academia_id, entrenador_id, equipo_id, rol_en_equipo)
                    VALUES (:aid, :eid, :eqid, 'principal')
                    RETURNING id;
                ");
                $stmtAsigCoach->execute(['aid' => $academiaId, 'eid' => $coachId, 'eqid' => $equipoId]);
                $asigCoachId = $stmtAsigCoach->fetchColumn();
                $this->assertNotEmpty($asigCoachId);

                // 5. Representante
                $stmtRep = $pdo->prepare("
                    INSERT INTO negocio.representantes (academia_id, nombres, apellidos, cedula, telefono, correo)
                    VALUES (:aid, 'Carlos', 'González', 'V-15890123', '+58 412 5550001', 'carlos@example.com')
                    RETURNING id;
                ");
                $stmtRep->execute(['aid' => $academiaId]);
                $repId = $stmtRep->fetchColumn();
                $this->assertNotEmpty($repId);

                // 6. Jugador
                $stmtJugador = $pdo->prepare("
                    INSERT INTO negocio.jugadores (academia_id, nombres, apellidos, fecha_nacimiento, cedula, sexo, ficha_medica)
                    VALUES (:aid, 'Mateo', 'González', '2014-05-10', 'V-33123456', 'M', '{\"alergias\": [\"penicilina\"]}'::jsonb)
                    RETURNING id;
                ");
                $stmtJugador->execute(['aid' => $academiaId]);
                $jugadorId = $stmtJugador->fetchColumn();
                $this->assertNotEmpty($jugadorId);

                // 7. Vínculo Jugador - Representante (Parentesco)
                $stmtVinculo = $pdo->prepare("
                    INSERT INTO negocio.jugadores_representantes (academia_id, jugador_id, representante_id, tipo_relacion, es_contacto_principal)
                    VALUES (:aid, :jid, :rid, 'padre', TRUE)
                    RETURNING id;
                ");
                $stmtVinculo->execute(['aid' => $academiaId, 'jid' => $jugadorId, 'rid' => $repId]);
                $vinculoId = $stmtVinculo->fetchColumn();
                $this->assertNotEmpty($vinculoId);

                // 8. Asignación Jugador - Equipo
                $stmtAsigJug = $pdo->prepare("
                    INSERT INTO negocio.asignaciones_jugadores_equipos (academia_id, jugador_id, equipo_id, temporada, numero_camiseta, posicion)
                    VALUES (:aid, :jid, :eqid, '2026', 10, 'Mediocampista')
                    RETURNING id;
                ");
                $stmtAsigJug->execute(['aid' => $academiaId, 'jid' => $jugadorId, 'eqid' => $equipoId]);
                $asigJugId = $stmtAsigJug->fetchColumn();
                $this->assertNotEmpty($asigJugId);

                // 9. Comprobar consulta unificada (Ficha deportiva y familiar completa)
                $stmtFicha = $pdo->prepare("
                    SELECT 
                        j.nombres AS jugador_nombres,
                        j.apellidos AS jugador_apellidos,
                        j.ficha_medica->>'alergias' AS alergias,
                        r.nombres AS representante_nombres,
                        jr.tipo_relacion,
                        jr.es_contacto_principal,
                        eq.nombre AS equipo,
                        cat.nombre AS categoria,
                        u.nombre AS entrenador,
                        aje.numero_camiseta,
                        aje.posicion
                    FROM negocio.jugadores j
                    JOIN negocio.jugadores_representantes jr ON jr.jugador_id = j.id
                    JOIN negocio.representantes r ON r.id = jr.representante_id
                    JOIN negocio.asignaciones_jugadores_equipos aje ON aje.jugador_id = j.id
                    JOIN negocio.equipos eq ON eq.id = aje.equipo_id
                    JOIN negocio.categorias cat ON cat.id = eq.categoria_id
                    JOIN negocio.asignaciones_entrenadores_equipos aee ON aee.equipo_id = eq.id
                    JOIN seguridad.usuarios u ON u.id = aee.entrenador_id
                    WHERE j.id = :jid AND j.academia_id = :aid
                ");
                $stmtFicha->execute(['jid' => $jugadorId, 'aid' => $academiaId]);
                $ficha = $stmtFicha->fetch(PDO::FETCH_ASSOC);

                $this->assertSame('Mateo', $ficha['jugador_nombres']);
                $this->assertSame('González', $ficha['jugador_apellidos']);
                $this->assertSame('Carlos', $ficha['representante_nombres']);
                $this->assertSame('padre', $ficha['tipo_relacion']);
                $this->assertTrue((bool)$ficha['es_contacto_principal']);
                $this->assertSame('Equipo Titular', $ficha['equipo']);
                $this->assertSame('Sub-12', $ficha['categoria']);
                $this->assertSame('Prof. Martínez', $ficha['entrenador']);
                $this->assertSame(10, (int)$ficha['numero_camiseta']);
                $this->assertSame('Mediocampista', $ficha['posicion']);

                // Rollback intencional para no persistir datos de prueba
                throw new Exception('Rollback test deportivo');
            });
        } catch (Exception $e) {
            $this->assertSame('Rollback test deportivo', $e->getMessage());
        }
    }

    public function testRestriccionOnDeleteRestrictEnCategoriasConEquipos(): void
    {
        $this->expectException(PDOException::class);

        Database::transaction(function (PDO $pdo) {
            $stmtAcademia = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Restrict') RETURNING id;");
            $stmtAcademia->execute();
            $aid = $stmtAcademia->fetchColumn();

            $stmtCat = $pdo->prepare("INSERT INTO negocio.categorias (academia_id, nombre) VALUES (:aid, 'Sub-15') RETURNING id;");
            $stmtCat->execute(['aid' => $aid]);
            $cid = $stmtCat->fetchColumn();

            $stmtEq = $pdo->prepare("INSERT INTO negocio.equipos (academia_id, categoria_id, nombre) VALUES (:aid, :cid, 'Equipo B') RETURNING id;");
            $stmtEq->execute(['aid' => $aid, 'cid' => $cid]);

            // Intentar borrar la categoría con equipos asociados DEBE lanzar violación de clave foránea ON DELETE RESTRICT
            $pdo->exec("DELETE FROM negocio.categorias WHERE id = '{$cid}'");
        });
    }

    public function testRestriccionUnicidadDeNombreDeCategoriaPorAcademia(): void
    {
        $this->expectException(PDOException::class);

        Database::transaction(function (PDO $pdo) {
            $stmtAcademia = $pdo->prepare("INSERT INTO negocio.academias (nombre) VALUES ('Academia Unique') RETURNING id;");
            $stmtAcademia->execute();
            $aid = $stmtAcademia->fetchColumn();

            $stmtCat1 = $pdo->prepare("INSERT INTO negocio.categorias (academia_id, nombre) VALUES (:aid, 'Sub-8')");
            $stmtCat1->execute(['aid' => $aid]);

            // Duplicar el mismo nombre de categoría en la misma academia debe fallar
            $stmtCat2 = $pdo->prepare("INSERT INTO negocio.categorias (academia_id, nombre) VALUES (:aid, 'Sub-8')");
            $stmtCat2->execute(['aid' => $aid]);
        });
    }

    public function testIndicesRequeridosExistenEnPostgres(): void
    {
        $indicesEsperados = [
            'idx_categorias_academia',
            'idx_equipos_academia_categoria',
            'idx_representantes_academia_cedula',
            'idx_representantes_busqueda',
            'idx_jugadores_busqueda',
            'idx_jugadores_cedula',
            'idx_jugadores_estado',
            'idx_jugadores_rep_jugador',
            'idx_jugadores_rep_rep',
            'idx_asig_jug_equipos',
            'idx_asig_jug_jugador',
            'idx_asig_entrenador_equipo',
            'idx_asig_entrenador_usuario',
        ];

        $stmt = $this->db->query("
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'negocio'
        ");
        $indicesEnDb = $stmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($indicesEsperados as $indice) {
            $this->assertContains(
                $indice,
                $indicesEnDb,
                "El índice {$indice} no fue encontrado en el esquema negocio de PostgreSQL."
            );
        }
    }
}
