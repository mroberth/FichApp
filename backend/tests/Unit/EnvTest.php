<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\Env;

final class EnvTest extends TestCase
{
    public function testCanRetrieveEnvironmentVariablesWithDefault(): void
    {
        $nonExistent = Env::get('NON_EXISTENT_VAR_' . uniqid(), 'default_val');
        $this->assertSame('default_val', $nonExistent);
    }

    public function testCanParseBooleanAndNullValues(): void
    {
        putenv('TEST_BOOL_TRUE=true');
        putenv('TEST_BOOL_FALSE=false');
        putenv('TEST_NULL=null');

        $this->assertTrue(Env::get('TEST_BOOL_TRUE'));
        $this->assertFalse(Env::get('TEST_BOOL_FALSE'));
        $this->assertNull(Env::get('TEST_NULL'));
    }
}
