<?php

declare(strict_types=1);

namespace FichApp\Infrastructure\Persistence;

use PDO;
use PDOException;
use RuntimeException;
use Throwable;
use FichApp\Support\Env;

/**
 * Gestor centralizado de conexiones PDO y control estricto de transacciones ACID.
 */
final class Database
{
    private static ?PDO $connection = null;

    /**
     * Obtiene la conexión PDO activa o inicializa una nueva según la configuración
     */
    public static function getConnection(): PDO
    {
        if (self::$connection === null) {
            self::$connection = self::createConnection();
        }
        return self::$connection;
    }

    /**
     * Permite inyectar una conexión manual (útil para tests con SQLite en memoria)
     */
    public static function setConnection(?PDO $pdo): void
    {
        self::$connection = $pdo;
    }

    /**
     * Ejecuta una acción dentro de una transacción segura de base de datos
     */
    public static function transaction(callable $callback): mixed
    {
        $pdo = self::getConnection();

        if ($pdo->inTransaction()) {
            return $callback($pdo);
        }

        $pdo->beginTransaction();

        try {
            $result = $callback($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    private static function createConnection(): PDO
    {
        $driver = Env::get('DB_CONNECTION', 'pgsql');

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            return match ($driver) {
                'pgsql' => self::createPgsqlConnection($options),
                'mysql' => self::createMysqlConnection($options),
                'sqlite' => self::createSqliteConnection($options),
                default => throw new RuntimeException("Driver de base de datos no soportado: '{$driver}'"),
            };
        } catch (PDOException $e) {
            throw new RuntimeException("Error de conexión a la base de datos [{$driver}]: " . $e->getMessage(), (int)$e->getCode(), $e);
        }
    }

    private static function createPgsqlConnection(array $options): PDO
    {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '5432');
        $dbname = Env::get('DB_DATABASE', 'fichapp_db');
        $user = Env::get('DB_USERNAME', 'postgres');
        $pass = Env::get('DB_PASSWORD', 'postgres');

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
        return new PDO($dsn, $user, $pass, $options);
    }

    private static function createMysqlConnection(array $options): PDO
    {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $dbname = Env::get('DB_DATABASE', 'fichapp_db');
        $user = Env::get('DB_USERNAME', 'root');
        $pass = Env::get('DB_PASSWORD', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        return new PDO($dsn, $user, $pass, $options);
    }

    private static function createSqliteConnection(array $options): PDO
    {
        $path = Env::get('DB_DATABASE', ':memory:');
        return new PDO("sqlite:{$path}", null, null, $options);
    }
}
