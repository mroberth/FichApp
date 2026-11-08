<?php

declare(strict_types=1);

namespace FichApp\Tests\Unit;

use PHPUnit\Framework\TestCase;
use FichApp\Support\DecimalMath;
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
        // Caso de descuento de pronto-pago ($25 base - $20 pronto-pago = $5 descuento)
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
        // 1050 VES recibidos a tasa 52.50 = 20.00 USD exactos
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
