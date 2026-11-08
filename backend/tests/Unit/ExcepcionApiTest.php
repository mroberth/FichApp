<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\ExcepcionApi;
use App\Core\ErrorCodes;

final class ExcepcionApiTest extends TestCase
{
    public function testFabricaValidacion(): void
    {
        $e = ExcepcionApi::validacion('El monto es requerido');
        $this->assertSame(400, $e->estado);
        $this->assertSame(ErrorCodes::VALIDACION, $e->codigo);
        $this->assertSame('El monto es requerido', $e->getMessage());
    }

    public function testFabricaNoEncontrado(): void
    {
        $e = ExcepcionApi::noEncontrado('El jugador no existe');
        $this->assertSame(404, $e->estado);
        $this->assertSame(ErrorCodes::NO_ENCONTRADO, $e->codigo);
    }

    public function testFabricaYaExiste(): void
    {
        $e = ExcepcionApi::yaExiste('Esta mensualidad ya existe');
        $this->assertSame(409, $e->estado);
        $this->assertSame(ErrorCodes::YA_EXISTE, $e->codigo);
    }
}
