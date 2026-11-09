<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\DTOs\LoginDTO;
use App\Core\ExcepcionApi;
use App\Core\ErrorCodes;

final class LoginDTOTest extends TestCase
{
    public function testCreaLoginDtoExitosamenteConCamposEstandar(): void
    {
        $datos = [
            'identificador_acceso' => 'admin_obelisco',
            'contrasena'           => 'secreto123',
            'academia_id'          => 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ];

        $dto = LoginDTO::desdeArray($datos);

        $this->assertSame('admin_obelisco', $dto->identificadorAcceso);
        $this->assertSame('secreto123', $dto->contrasena);
        $this->assertSame('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', $dto->academiaId);
    }

    public function testSoportaCamposAlternativosComoCorreoYPassword(): void
    {
        $datos = [
            'correo'   => 'coach@obeliscofc.com',
            'password' => 'clave456',
        ];

        $dto = LoginDTO::desdeArray($datos);

        $this->assertSame('coach@obeliscofc.com', $dto->identificadorAcceso);
        $this->assertSame('clave456', $dto->contrasena);
        $this->assertNull($dto->academiaId);
    }

    public function testLanzaExcepcionValidacionSiFaltanCampos(): void
    {
        $this->expectException(ExcepcionApi::class);

        try {
            LoginDTO::desdeArray([]);
        } catch (ExcepcionApi $e) {
            $this->assertSame(400, $e->estado);
            $this->assertSame(ErrorCodes::VALIDACION, $e->codigo);
            $this->assertArrayHasKey('identificador_acceso', $e->detalles);
            $this->assertArrayHasKey('contrasena', $e->detalles);
            throw $e;
        }
    }
}
