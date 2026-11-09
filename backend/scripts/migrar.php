<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Env;
use App\Core\Database;

// 1. Cargar entorno
Env::load(__DIR__ . '/../.env');

echo "==========================================================\n";
echo "🐘 FichApp — Ejecutor de Migraciones PostgreSQL\n";
echo "==========================================================\n";
echo "Base de datos objetivo: " . Env::get('DB_DATABASE') . "\n";
echo "Host: " . Env::get('DB_HOST') . ":" . Env::get('DB_PORT') . "\n";
echo "----------------------------------------------------------\n";

try {
    $pdo = Database::getConnection();

    // 2. Crear tabla de control de migraciones en el esquema seguridad
    $pdo->exec("CREATE SCHEMA IF NOT EXISTS seguridad;");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS seguridad.migraciones_ejecutadas (
            id SERIAL PRIMARY KEY,
            nombre_archivo VARCHAR(255) NOT NULL UNIQUE,
            ejecutado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // 3. Obtener migraciones ya aplicadas
    $stmt = $pdo->query("SELECT nombre_archivo FROM seguridad.migraciones_ejecutadas");
    $aplicadas = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 4. Buscar archivos SQL en backend/migrations/
    $directorio = __DIR__ . '/../migrations';
    $archivos = glob("{$directorio}/*.sql");
    sort($archivos);

    if (empty($archivos)) {
        echo "ℹ️ No se encontraron archivos de migración en {$directorio}\n";
        exit(0);
    }

    $pendientes = 0;

    foreach ($archivos as $archivo) {
        $nombre = basename($archivo);

        if (in_array($nombre, $aplicadas, true)) {
            echo "  ✓ [Ya aplicada] {$nombre}\n";
            continue;
        }

        echo "  ⚡ [Ejecutando] {$nombre}... ";
        $sql = file_get_contents($archivo);

        if ($sql === false || trim($sql) === '') {
            echo "⚠️ Archivo vacío, omitiendo.\n";
            continue;
        }

        // Ejecutar migración dentro de una transacción
        Database::transaction(function (PDO $db) use ($sql, $nombre) {
            $db->exec($sql);
            $ins = $db->prepare("INSERT INTO seguridad.migraciones_ejecutadas (nombre_archivo) VALUES (:nombre)");
            $ins->execute(['nombre' => $nombre]);
        });

        echo "✅ OK!\n";
        $pendientes++;
    }

    echo "----------------------------------------------------------\n";
    if ($pendientes === 0) {
        echo "🎉 Todas las migraciones están al día. Base de datos sincronizada.\n";
    } else {
        echo "🎉 Se aplicaron {$pendientes} nueva(s) migración(es) con éxito.\n";
    }
    echo "==========================================================\n";

} catch (Throwable $e) {
    echo "\n❌ ERROR FATAL EN MIGRACIÓN: " . $e->getMessage() . "\n";
    exit(1);
}
