<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Core\Router;
use App\Core\ExcepcionApi;
use App\Core\ErrorCodes;
use App\Core\ContextoTenant;
use App\Middlewares\TenantMiddleware;

final class RouterTest extends TestCase
{
    protected function setUp(): void
    {
        Router::limpiar();
        ContextoTenant::limpiar();
        $_GET = [];
        unset($_SERVER['HTTP_X_ACADEMIA_ID']);
    }

    protected function tearDown(): void
    {
        Router::limpiar();
        ContextoTenant::limpiar();
        $_GET = [];
        unset($_SERVER['HTTP_X_ACADEMIA_ID']);
    }

    public function testDespachaRutaGetSimple(): void
    {
        Router::get('api/v1/ping', function () {
            return 'pong';
        });

        $resultado = Router::despachar('GET', '/api/v1/ping');
        $this->assertSame('pong', $resultado);
    }

    public function testCapturaParametrosDinamicosEnRuta(): void
    {
        Router::get('api/v1/jugadores/{id}', function (string $id) {
            return "Jugador: {$id}";
        });

        $resultado = Router::despachar('GET', '/api/v1/jugadores/42');
        $this->assertSame('Jugador: 42', $resultado);
        $this->assertSame('42', $_GET['id']);
    }

    public function testSoportaGruposConPrefijo(): void
    {
        Router::grupo('api/v1', function () {
            Router::post('pagos', function () {
                return 'pago_creado';
            });
        });

        $resultado = Router::despachar('POST', '/api/v1/pagos');
        $this->assertSame('pago_creado', $resultado);
    }

    public function testRutaInexistenteLanzaExcepcion404(): void
    {
        Router::get('api/v1/usuarios', fn() => 'ok');

        $this->expectException(ExcepcionApi::class);
        try {
            Router::despachar('GET', '/api/v1/ruta-que-no-existe');
        } catch (ExcepcionApi $e) {
            $this->assertSame(404, $e->estado);
            $this->assertSame(ErrorCodes::RUTA_NO_ENCONTRADA, $e->codigo);
            throw $e;
        }
    }

    public function testMetodoNoPermitidoLanzaExcepcion405(): void
    {
        Router::get('api/v1/usuarios', fn() => 'ok');

        $this->expectException(ExcepcionApi::class);
        try {
            Router::despachar('POST', '/api/v1/usuarios');
        } catch (ExcepcionApi $e) {
            $this->assertSame(405, $e->estado);
            $this->assertSame(ErrorCodes::METODO_NO_PERMITIDO, $e->codigo);
            throw $e;
        }
    }

    public function testTenantMiddlewareEstableceContexto(): void
    {
        $_SERVER['HTTP_X_ACADEMIA_ID'] = 'obelisco-fc-123';

        TenantMiddleware::manejar();

        $this->assertSame('obelisco-fc-123', ContextoTenant::getAcademiaId());
        $this->assertSame('obelisco-fc-123', ContextoTenant::exigirAcademiaId());
    }

    public function testTenantMiddlewareExigirSinContextoLanzaExcepcion403(): void
    {
        $this->expectException(ExcepcionApi::class);
        try {
            TenantMiddleware::exigir();
        } catch (ExcepcionApi $e) {
            $this->assertSame(403, $e->estado);
            $this->assertSame(ErrorCodes::ACCESO_DENEGADO, $e->codigo);
            throw $e;
        }
    }
}
