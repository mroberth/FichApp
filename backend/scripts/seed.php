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

    echo "🎉 Seed completado exitosamente." . PHP_EOL;
} catch (\Throwable $e) {
    echo "❌ Error ejecutando seed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
