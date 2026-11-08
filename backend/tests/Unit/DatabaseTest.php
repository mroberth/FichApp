<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\Database;
use PDO;
use Exception;

final class DatabaseTest extends TestCase
{
    protected function setUp(): void
    {
        putenv('DB_CONNECTION=sqlite');
        putenv('DB_DATABASE=:memory:');
        Database::setConnection(null);
    }

    protected function tearDown(): void
    {
        Database::setConnection(null);
    }

    public function testCanEstablishStrictPdoConnection(): void
    {
        $pdo = Database::getConnection();

        $this->assertInstanceOf(PDO::class, $pdo);
        $this->assertSame(PDO::ERRMODE_EXCEPTION, $pdo->getAttribute(PDO::ATTR_ERRMODE));
        $this->assertSame(PDO::FETCH_ASSOC, $pdo->getAttribute(PDO::ATTR_DEFAULT_FETCH_MODE));
    }

    public function testTransactionCommitsOnSuccess(): void
    {
        $pdo = Database::getConnection();
        $pdo->exec("CREATE TABLE test_ledger (id INTEGER PRIMARY KEY, amount TEXT);");

        $result = Database::transaction(function (PDO $db) {
            $stmt = $db->prepare("INSERT INTO test_ledger (amount) VALUES (:amount)");
            $stmt->execute(['amount' => '25.00']);
            return 'OK';
        });

        $this->assertSame('OK', $result);

        $stmt = $pdo->query("SELECT COUNT(*) FROM test_ledger");
        $count = (int)$stmt->fetchColumn();
        $this->assertSame(1, $count);
    }

    public function testTransactionRollsBackOnException(): void
    {
        $pdo = Database::getConnection();
        $pdo->exec("CREATE TABLE test_rollback (id INTEGER PRIMARY KEY, amount TEXT);");

        try {
            Database::transaction(function (PDO $db) {
                $stmt = $db->prepare("INSERT INTO test_rollback (amount) VALUES (:amount)");
                $stmt->execute(['amount' => '25.00']);
                throw new Exception("Simulación de error en la transacción");
            });
        } catch (Exception $e) {
            $this->assertSame("Simulación de error en la transacción", $e->getMessage());
        }

        $stmt = $pdo->query("SELECT COUNT(*) FROM test_rollback");
        $count = (int)$stmt->fetchColumn();
        $this->assertSame(0, $count);
    }
}
