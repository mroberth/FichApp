<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;

final class TenantMiddleware
{
    /**
     * Resuelve y valida el identificador de la academia para la petición
     */
    public static function manejar(): void
    {
        // 1. Prioridad: Token de autenticación (cuando esté activo)
        // 2. Cabecera HTTP X-Academia-Id (útil para pruebas, API clients y mobile)
        $academiaId = $_SERVER['HTTP_X_ACADEMIA_ID'] ?? null;

        if ($academiaId !== null && trim($academiaId) !== '') {
            ContextoTenant::setAcademiaId(trim($academiaId));
            return;
        }

        // Si la ruta requiere tenant y no vino establecido, se lanzará al invocar exigirAcademiaId()
    }

    /**
     * Middleware estricto para rutas privadas que no pueden operar sin academia_id
     */
    public static function exigir(): void
    {
        self::manejar();
        ContextoTenant::exigirAcademiaId();
    }
}
