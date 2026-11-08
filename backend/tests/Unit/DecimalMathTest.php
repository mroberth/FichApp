<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\DecimalMath;
use DivisionByZeroError;

final class DecimalMathTest extends TestCase
{
    public function testCanAddExactDecimalAmounts(): void
    {
        $this->assertSame('25.00', DecimalMath::add('20.00', '5.00', 2));
        $this->assertSame('10.50', DecimalMath::add('5.25', '5.25', 2));
    }

    public function testCanSubtractExactDecimalAmounts(): void
    {
        $this->assertSame('5.00', DecimalMath::sub('25.00', '20.00', 2));
        $this->assertSame('0.00', DecimalMath::sub('20.00', '20.00', 2));
        $this->assertSame('-5.00', DecimalMath::sub('20.00', '25.00', 2));
    }

    public function testCanMultiplyExactDecimalAmounts(): void
    {
        $this->assertSame('100.00', DecimalMath::mul('20.00', '5.00', 2));
    }

    public function testCanDivideVesToUsdWithTasaBcv(): void
    {
        $this->assertSame('20.00', DecimalMath::div('1050.00', '52.50', 2));
    }

    public function testDivisionByZeroThrowsException(): void
    {
        $this->expectException(DivisionByZeroError::class);
        DecimalMath::div('25.00', '0.00', 2);
    }

    public function testComparisonOfAmounts(): void
    {
        $this->assertSame(0, DecimalMath::comp('20.00', '20.00', 2));
        $this->assertSame(-1, DecimalMath::comp('19.99', '20.00', 2));
        $this->assertSame(1, DecimalMath::comp('20.01', '20.00', 2));
    }
}
