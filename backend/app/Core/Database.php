<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use Throwable;

final class Database
{
    private static ?PDO $conexion = null;

    public static function getConnection(): PDO
    {
        if (self::$conexion === null) {
            self::$conexion = self::crearConexion();
        }
        return self::$conexion;
    }

    public static function setConnection(?PDO $pdo): void
    {
        self::$conexion = $pdo;
    }

    public static function transaction(callable $callback): mixed
    {
        $pdo = self::getConnection();

        if ($pdo->inTransaction()) {
            return $callback($pdo);
        }

        $pdo->beginTransaction();

        try {
            $resultado = $callback($pdo);
            $pdo->commit();
            return $resultado;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    private static function crearConexion(): PDO
    {
        $driver = Env::get('DB_CONNECTION', 'pgsql');

        $opciones = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            return match ($driver) {
                'pgsql' => self::crearConexionPgsql($opciones),
                'mysql' => self::crearConexionMysql($opciones),
                'sqlite' => self::crearConexionSqlite($opciones),
                default => throw ExcepcionApi::errorInterno("Driver de base de datos no soportado: '{$driver}'"),
            };
        } catch (PDOException $e) {
            throw ExcepcionApi::errorInterno("Error conectando a la base de datos: " . $e->getMessage());
        }
    }

    private static function crearConexionPgsql(array $opciones): PDO
    {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '5432');
        $dbname = Env::get('DB_DATABASE', 'fichapp_db');
        $user = Env::get('DB_USERNAME', 'postgres');
        $pass = Env::get('DB_PASSWORD', 'postgres');

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";
        return new PDO($dsn, $user, $pass, $opciones);
    }

    private static function crearConexionMysql(array $opciones): PDO
    {
        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $dbname = Env::get('DB_DATABASE', 'fichapp_db');
        $user = Env::get('DB_USERNAME', 'root');
        $pass = Env::get('DB_PASSWORD', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        return new PDO($dsn, $user, $pass, $opciones);
    }

    private static function crearConexionSqlite(array $opciones): PDO
    {
        $path = Env::get('DB_DATABASE', ':memory:');
        return new PDO("sqlite:{$path}", null, null, $opciones);
    }
}
