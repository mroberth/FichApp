<?php

declare(strict_types=1);

/**
 * Script de inicialización de datos base (Seeder) para FichApp.
 * Inserta la academia piloto Obelisco FC y usuarios de prueba.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Database;

Env::load(__DIR__ . '/../.env');

echo "🌱 Iniciando Seed de datos iniciales en FichApp..." . PHP_EOL;

try {
    $pdo = Database::getConnection();

    // 1. Obtener o crear la academia piloto: Obelisco FC
    $stmt = $pdo->prepare("SELECT id FROM negocio.academias WHERE nombre = :nombre LIMIT 1");
    $stmt->execute(['nombre' => 'Obelisco FC']);
    $academiaId = $stmt->fetchColumn();

    if (!$academiaId) {
        $insertAcademia = $pdo->prepare("
            INSERT INTO negocio.academias (
                nombre, rif, telefono, correo, estado, zona_horaria, configuracion
            ) VALUES (
                :nombre, :rif, :telefono, :correo, 'activo', 'America/Caracas', :configuracion::jsonb
            ) RETURNING id
        ");
        $insertAcademia->execute([
            'nombre'        => 'Obelisco FC',
            'rif'           => 'J-50123456-7',
            'telefono'      => '+58 412 1234567',
            'correo'        => 'contacto@obeliscofc.com',
            'configuracion' => json_encode([
                'deporte_principal' => 'Fútbol',
                'sede'              => 'Barquisimeto, Lara',
                'moneda_defecto'    => 'USD',
            ]),
        ]);
        $academiaId = $insertAcademia->fetchColumn();
        echo "✅ Academia piloto creada: Obelisco FC (UUID: {$academiaId})" . PHP_EOL;
    } else {
        echo "ℹ️  Academia piloto ya existe: Obelisco FC (UUID: {$academiaId})" . PHP_EOL;
    }

    // 2. Crear o actualizar usuarios de prueba
    $usuarios = [
        [
            'nombre'               => 'Administrador Obelisco',
            'identificador_acceso' => 'admin',
            'correo'               => 'admin@obeliscofc.com',
            'telefono'             => '+58 412 0000001',
            'contrasena'           => 'password123',
            'rol'                  => 'administrador',
        ],
        [
            'nombre'               => 'Profesor Roberto (Entrenador)',
            'identificador_acceso' => 'entrenador',
            'correo'               => 'entrenador@obeliscofc.com',
            'telefono'             => '+58 414 0000002',
            'contrasena'           => 'password123',
            'rol'                  => 'entrenador',
        ],
    ];

    foreach ($usuarios as $u) {
        $hash = password_hash($u['contrasena'], PASSWORD_BCRYPT, ['cost' => 12]);

        $check = $pdo->prepare("
            SELECT id FROM seguridad.usuarios 
            WHERE academia_id = :academia_id AND identificador_acceso = :acceso
        ");
        $check->execute([
            'academia_id' => $academiaId,
            'acceso'      => $u['identificador_acceso'],
        ]);
        $usuarioExistente = $check->fetchColumn();

        if (!$usuarioExistente) {
            $insertUsuario = $pdo->prepare("
                INSERT INTO seguridad.usuarios (
                    academia_id, nombre, identificador_acceso, correo, telefono, contrasena_hash, rol, estado
                ) VALUES (
                    :academia_id, :nombre, :identificador_acceso, :correo, :telefono, :contrasena_hash, :rol, 'activo'
                ) RETURNING id
            ");
            $insertUsuario->execute([
                'academia_id'          => $academiaId,
                'nombre'               => $u['nombre'],
                'identificador_acceso' => $u['identificador_acceso'],
                'correo'               => $u['correo'],
                'telefono'             => $u['telefono'],
                'contrasena_hash'      => $hash,
                'rol'                  => $u['rol'],
            ]);
            $uid = $insertUsuario->fetchColumn();
            echo "✅ Usuario creado: {$u['identificador_acceso']} ({$u['rol']}) [Clave: {$u['contrasena']}] -> ID: {$uid}" . PHP_EOL;
        } else {
            // Actualizar contraseña por si acaso
            $update = $pdo->prepare("
                UPDATE seguridad.usuarios 
                SET contrasena_hash = :hash, actualizado_en = CURRENT_TIMESTAMP
                WHERE id = :id
            ");
            $update->execute(['hash' => $hash, 'id' => $usuarioExistente]);
            echo "ℹ️  Usuario ya existe (contraseña sincronizada): {$u['identificador_acceso']}" . PHP_EOL;
        }
    }

    // 3. Crear Categorías deportivas para Obelisco FC
    $categoriasData = [
        ['nombre' => 'Sub-10', 'edad_minima' => 8, 'edad_maxima' => 10, 'modalidad' => 'fútbol campo'],
        ['nombre' => 'Sub-12', 'edad_minima' => 10, 'edad_maxima' => 12, 'modalidad' => 'fútbol campo'],
        ['nombre' => 'Sub-14', 'edad_minima' => 12, 'edad_maxima' => 14, 'modalidad' => 'fútbol campo'],
    ];

    $categoriasIds = [];
    foreach ($categoriasData as $c) {
        $checkCat = $pdo->prepare("SELECT id FROM negocio.categorias WHERE academia_id = :aid AND nombre = :nom");
        $checkCat->execute(['aid' => $academiaId, 'nom' => $c['nombre']]);
        $catId = $checkCat->fetchColumn();

        if (!$catId) {
            $insCat = $pdo->prepare("
                INSERT INTO negocio.categorias (academia_id, nombre, modalidad, edad_minima, edad_maxima)
                VALUES (:aid, :nom, :mod, :min, :max)
                RETURNING id
            ");
            $insCat->execute([
                'aid' => $academiaId,
                'nom' => $c['nombre'],
                'mod' => $c['modalidad'],
                'min' => $c['edad_minima'],
                'max' => $c['edad_maxima'],
            ]);
            $catId = $insCat->fetchColumn();
            echo "✅ Categoría creada: {$c['nombre']} (ID: {$catId})" . PHP_EOL;
        } else {
            echo "ℹ️  Categoría ya existe: {$c['nombre']}" . PHP_EOL;
        }
        $categoriasIds[$c['nombre']] = $catId;
    }

    // 4. Crear Equipos de Obelisco FC
    $equipoSub12Id = null;
    $checkEq = $pdo->prepare("SELECT id FROM negocio.equipos WHERE academia_id = :aid AND categoria_id = :cid AND nombre = :nom");
    $checkEq->execute([
        'aid' => $academiaId,
        'cid' => $categoriasIds['Sub-12'],
        'nom' => 'Obelisco FC Sub-12 A'
    ]);
    $equipoSub12Id = $checkEq->fetchColumn();

    if (!$equipoSub12Id) {
        $insEq = $pdo->prepare("
            INSERT INTO negocio.equipos (academia_id, categoria_id, nombre)
            VALUES (:aid, :cid, :nom)
            RETURNING id
        ");
        $insEq->execute([
            'aid' => $academiaId,
            'cid' => $categoriasIds['Sub-12'],
            'nom' => 'Obelisco FC Sub-12 A'
        ]);
        $equipoSub12Id = $insEq->fetchColumn();
        echo "✅ Equipo creado: Obelisco FC Sub-12 A (ID: {$equipoSub12Id})" . PHP_EOL;
    } else {
        echo "ℹ️  Equipo ya existe: Obelisco FC Sub-12 A" . PHP_EOL;
    }

    // 5. Asignar Entrenador Roberto a Sub-12 A
    $stmtCoach = $pdo->prepare("SELECT id FROM seguridad.usuarios WHERE academia_id = :aid AND identificador_acceso = 'entrenador'");
    $stmtCoach->execute(['aid' => $academiaId]);
    $entrenadorRobertoId = $stmtCoach->fetchColumn();

    if ($entrenadorRobertoId && $equipoSub12Id) {
        $checkAsigCoach = $pdo->prepare("
            SELECT id FROM negocio.asignaciones_entrenadores_equipos 
            WHERE academia_id = :aid AND entrenador_id = :eid AND equipo_id = :eqid
        ");
        $checkAsigCoach->execute([
            'aid' => $academiaId,
            'eid' => $entrenadorRobertoId,
            'eqid' => $equipoSub12Id,
        ]);
        if (!$checkAsigCoach->fetchColumn()) {
            $insAsigCoach = $pdo->prepare("
                INSERT INTO negocio.asignaciones_entrenadores_equipos (
                    academia_id, entrenador_id, equipo_id, rol_en_equipo
                ) VALUES (:aid, :eid, :eqid, 'principal')
            ");
            $insAsigCoach->execute([
                'aid' => $academiaId,
                'eid' => $entrenadorRobertoId,
                'eqid' => $equipoSub12Id,
            ]);
            echo "✅ Entrenador Roberto asignado a Obelisco FC Sub-12 A" . PHP_EOL;
        }
    }

    // 6. Representante de prueba (Familia Pérez)
    $checkRep = $pdo->prepare("SELECT id FROM negocio.representantes WHERE academia_id = :aid AND cedula = :ced");
    $checkRep->execute(['aid' => $academiaId, 'ced' => 'V-14234567']);
    $repCarlosId = $checkRep->fetchColumn();

    if (!$repCarlosId) {
        $insRep = $pdo->prepare("
            INSERT INTO negocio.representantes (
                academia_id, nombres, apellidos, cedula, telefono, correo, direccion
            ) VALUES (
                :aid, 'Carlos', 'Pérez', 'V-14234567', '+58 412 1112233', 'carlos.perez@example.com', 'Urb. El Obelisco, Barquisimeto'
            ) RETURNING id
        ");
        $insRep->execute(['aid' => $academiaId]);
        $repCarlosId = $insRep->fetchColumn();
        echo "✅ Representante creado: Carlos Pérez (ID: {$repCarlosId})" . PHP_EOL;
    } else {
        echo "ℹ️  Representante ya existe: Carlos Pérez" . PHP_EOL;
    }

    // 7. Jugadores de prueba (Hermanos Pérez)
    $jugadoresData = [
        [
            'nombres'          => 'Santiago',
            'apellidos'        => 'Pérez',
            'fecha_nacimiento' => '2014-03-15',
            'cedula'           => 'V-34567890',
            'sexo'             => 'M',
            'ficha_medica'     => json_encode(['tipo_sangre' => 'O+', 'alergias' => []]),
            'dorsal'           => 10,
            'posicion'         => 'Mediocampista',
            'equipo_id'        => $equipoSub12Id,
        ],
        [
            'nombres'          => 'Mateo',
            'apellidos'        => 'Pérez',
            'fecha_nacimiento' => '2016-08-20',
            'cedula'           => 'V-35678901',
            'sexo'             => 'M',
            'ficha_medica'     => json_encode(['tipo_sangre' => 'O+', 'alergias' => ['ibuprofeno']]),
            'dorsal'           => 7,
            'posicion'         => 'Delantero',
            'equipo_id'        => null, // Aún sin equipo asignado
        ],
    ];

    foreach ($jugadoresData as $j) {
        $checkJug = $pdo->prepare("SELECT id FROM negocio.jugadores WHERE academia_id = :aid AND cedula = :ced");
        $checkJug->execute(['aid' => $academiaId, 'ced' => $j['cedula']]);
        $jugId = $checkJug->fetchColumn();

        if (!$jugId) {
            $insJug = $pdo->prepare("
                INSERT INTO negocio.jugadores (
                    academia_id, nombres, apellidos, fecha_nacimiento, cedula, sexo, ficha_medica
                ) VALUES (
                    :aid, :nom, :ape, :fec, :ced, :sex, :fic::jsonb
                ) RETURNING id
            ");
            $insJug->execute([
                'aid' => $academiaId,
                'nom' => $j['nombres'],
                'ape' => $j['apellidos'],
                'fec' => $j['fecha_nacimiento'],
                'ced' => $j['cedula'],
                'sex' => $j['sexo'],
                'fic' => $j['ficha_medica'],
            ]);
            $jugId = $insJug->fetchColumn();
            echo "✅ Jugador creado: {$j['nombres']} {$j['apellidos']} (ID: {$jugId})" . PHP_EOL;

            // Vincular al representante Carlos Pérez
            $insVinculo = $pdo->prepare("
                INSERT INTO negocio.jugadores_representantes (
                    academia_id, jugador_id, representante_id, tipo_relacion, es_contacto_principal
                ) VALUES (
                    :aid, :jid, :rid, 'padre', TRUE
                )
            ");
            $insVinculo->execute([
                'aid' => $academiaId,
                'jid' => $jugId,
                'rid' => $repCarlosId,
            ]);

            // Asignar al equipo si aplica
            if ($j['equipo_id']) {
                $insAsig = $pdo->prepare("
                    INSERT INTO negocio.asignaciones_jugadores_equipos (
                        academia_id, jugador_id, equipo_id, temporada, numero_camiseta, posicion
                    ) VALUES (
                        :aid, :jid, :eqid, '2026', :num, :pos
                    )
                ");
                $insAsig->execute([
                    'aid'  => $academiaId,
                    'jid'  => $jugId,
                    'eqid' => $j['equipo_id'],
                    'num'  => $j['dorsal'],
                    'pos'  => $j['posicion'],
                ]);
            }
        } else {
            echo "ℹ️  Jugador ya existe: {$j['nombres']} {$j['apellidos']}" . PHP_EOL;
        }
    }

    echo "🎉 Seed completado exitosamente." . PHP_EOL;
} catch (\Throwable $e) {
    echo "❌ Error ejecutando seed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
