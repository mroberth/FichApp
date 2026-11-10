<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\ExcepcionApi;
use App\DTOs\RegistrarJugadorDTO;
use App\Repositories\JugadorRepository;
use App\Services\JugadorService;

class JugadorServiceResilienceTest extends TestCase
{
    public function testCedulaDuplicadaLanzaCodigoHttp409(): void
    {
        $mockJugadorRepo = $this->createMock(JugadorRepository::class);
        $mockJugadorRepo->expects($this->once())
            ->method('buscarPorCedula')
            ->with('V-28111222', '00000000-0000-0000-0000-000000000001')
            ->willReturn(['id' => '00000000-0000-0000-0000-000000000002', 'nombres' => 'Existente']);

        $service = new JugadorService(jugadorRepo: $mockJugadorRepo);

        $dto = RegistrarJugadorDTO::desdeArray([
            'nombres'          => 'Carlos',
            'apellidos'        => 'Pérez',
            'cedula'           => 'V-28111222',
            'representante_id' => '00000000-0000-0000-0000-000000000003',
        ]);

        $this->expectException(ExcepcionApi::class);

        try {
            $service->registrarJugador('00000000-0000-0000-0000-000000000001', $dto);
        } catch (ExcepcionApi $e) {
            $this->assertSame(409, $e->estado, 'El código HTTP debe ser 409 Conflict');
            $this->assertSame('ALREADY_EXISTS', $e->codigo, 'El código de negocio debe ser ALREADY_EXISTS');
            throw $e;
        }
    }
}
