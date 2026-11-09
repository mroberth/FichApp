<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\DTOs\RegistrarJugadorDTO;
use App\DTOs\CrearRepresentanteDTO;
use App\DTOs\ActualizarJugadorDTO;
use App\DTOs\AsignarEquipoDTO;
use App\Core\ExcepcionApi;

final class RegistrarJugadorDTOTest extends TestCase
{
    public function testCrearDesdeArrayExitosoConRepresentanteEmbebido(): void
    {
        $datos = [
            'nombres'                => 'Alejandro',
            'apellidos'              => 'Morales',
            'fecha_nacimiento'       => '2015-06-12',
            'cedula'                 => 'v-34111222',
            'sexo'                   => 'm',
            'ficha_medica'           => ['alergias' => ['maní'], 'tipo_sangre' => 'A+'],
            'representante_nombres'  => 'Luis',
            'representante_apellidos'=> 'Morales',
            'representante_telefono' => '+58 412 9998877',
            'representante_cedula'   => 'v-16111222',
            'representante_correo'   => 'luis@example.com',
            'tipo_relacion'          => 'padre',
            'es_contacto_principal'  => true,
            'equipo_id'              => 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            'temporada'              => '2026',
            'numero_camiseta'        => 9,
            'posicion'               => 'Delantero',
        ];

        $dto = RegistrarJugadorDTO::desdeArray($datos);

        $this->assertSame('Alejandro', $dto->nombres);
        $this->assertSame('Morales', $dto->apellidos);
        $this->assertSame('2015-06-12', $dto->fechaNacimiento);
        $this->assertSame('V-34111222', $dto->cedula);
        $this->assertSame('M', $dto->sexo);
        $this->assertSame(['maní'], $dto->fichaMedica['alergias']);
        $this->assertNull($dto->representanteId);
        $this->assertInstanceOf(CrearRepresentanteDTO::class, $dto->datosRepresentante);
        $this->assertSame('Luis', $dto->datosRepresentante->nombres);
        $this->assertSame('+58 412 9998877', $dto->datosRepresentante->telefono);
        $this->assertSame('V-16111222', $dto->datosRepresentante->cedula);
        $this->assertSame('padre', $dto->tipoRelacion);
        $this->assertTrue($dto->esContactoPrincipal);
        $this->assertSame(9, $dto->numeroCamiseta);
        $this->assertSame('Delantero', $dto->posicion);
    }

    public function testCrearDesdeArrayExitosoConRepresentanteIdExistente(): void
    {
        $datos = [
            'nombres'          => 'Sofía',
            'apellidos'        => 'Ramos',
            'representante_id' => '123e4567-e89b-12d3-a456-426614174000',
        ];

        $dto = RegistrarJugadorDTO::desdeArray($datos);

        $this->assertSame('Sofía', $dto->nombres);
        $this->assertSame('Ramos', $dto->apellidos);
        $this->assertSame('123e4567-e89b-12d3-a456-426614174000', $dto->representanteId);
        $this->assertNull($dto->datosRepresentante);
    }

    public function testFallaCuandoFaltanNombresOApellidos(): void
    {
        $this->expectException(ExcepcionApi::class);

        RegistrarJugadorDTO::desdeArray([
            'representante_id' => '123e4567-e89b-12d3-a456-426614174000',
        ]);
    }

    public function testFallaCuandoNoHayRepresentanteIdNiDatosDeRepresentante(): void
    {
        $this->expectException(ExcepcionApi::class);

        RegistrarJugadorDTO::desdeArray([
            'nombres'   => 'Juan',
            'apellidos' => 'Pérez',
        ]);
    }

    public function testFallaConFechaInvalida(): void
    {
        $this->expectException(ExcepcionApi::class);

        RegistrarJugadorDTO::desdeArray([
            'nombres'          => 'Juan',
            'apellidos'        => 'Pérez',
            'fecha_nacimiento' => '15/06/2014',
            'representante_id' => '123e4567-e89b-12d3-a456-426614174000',
        ]);
    }

    public function testActualizarJugadorDTODesdeArray(): void
    {
        $dto = ActualizarJugadorDTO::desdeArray([
            'nombres' => 'Juan Carlos',
            'estado'  => 'inactivo',
        ]);

        $this->assertSame('Juan Carlos', $dto->nombres);
        $this->assertSame('inactivo', $dto->estado);
        $this->assertNull($dto->apellidos);

        $filtrado = $dto->aArrayFiltrado();
        $this->assertArrayHasKey('nombres', $filtrado);
        $this->assertArrayHasKey('estado', $filtrado);
        $this->assertArrayNotHasKey('apellidos', $filtrado);
    }

    public function testAsignarEquipoDTODesdeArray(): void
    {
        $dto = AsignarEquipoDTO::desdeArray([
            'jugador_id'      => 'j1',
            'equipo_id'       => 'e1',
            'numero_camiseta' => '10',
            'posicion'        => 'Portero',
        ]);

        $this->assertSame('j1', $dto->jugadorId);
        $this->assertSame('e1', $dto->equipoId);
        $this->assertSame(10, $dto->numeroCamiseta);
        $this->assertSame('Portero', $dto->posicion);
    }
}
