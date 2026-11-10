<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\DTOs\SincronizarAsistenciaDTO;
use App\Core\ExcepcionApi;

final class SincronizarAsistenciaDtoTest extends TestCase
{
    public function testInstanciaValidaDesdeArray(): void
    {
        $payload = [
            'sesiones' => [
                [
                    'id' => 'ses-1',
                    'equipo_id' => 'eq-1',
                    'fecha_sesion' => '2026-11-10T16:00:00Z',
                    'lugar' => 'Cancha 1',
                    'observaciones' => 'Buen ritmo',
                ]
            ],
            'registros' => [
                [
                    'id' => 'reg-1',
                    'sesion_id' => 'ses-1',
                    'jugador_id' => 'jug-1',
                    'estado_asistencia' => 'presente',
                    'observaciones' => '',
                ]
            ]
        ];

        $dto = SincronizarAsistenciaDTO::desdeArray($payload);
        $this->assertCount(1, $dto->sesiones);
        $this->assertCount(1, $dto->registros);
        $this->assertSame('ses-1', $dto->sesiones[0]['id']);
        $this->assertSame('presente', $dto->registros[0]['estado_asistencia']);
    }

    public function testFallaSiSesionNoTieneCamposObligatorios(): void
    {
        $this->expectException(ExcepcionApi::class);

        $payload = [
            'sesiones' => [
                ['id' => 'ses-1'] // Falta equipo_id y fecha_sesion
            ],
            'registros' => []
        ];

        SincronizarAsistenciaDTO::desdeArray($payload);
    }

    public function testFallaSiEstadoAsistenciaEsInvalido(): void
    {
        $this->expectException(ExcepcionApi::class);

        $payload = [
            'sesiones' => [],
            'registros' => [
                [
                    'id' => 'reg-1',
                    'sesion_id' => 'ses-1',
                    'jugador_id' => 'jug-1',
                    'estado_asistencia' => 'demorado', // Inválido
                ]
            ]
        ];

        SincronizarAsistenciaDTO::desdeArray($payload);
    }
}
