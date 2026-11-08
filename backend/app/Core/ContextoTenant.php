<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Gestor del contexto de inquilino (Tenant / Academia) para la petición actual.
 * Garantiza que cada operación conozca la academia del usuario autenticado.
 */
final class ContextoTenant
{
    private static ?string $academiaId = null;

    public static function setAcademiaId(?string $id): void
    {
        self::$academiaId = $id;
    }

    public static function getAcademiaId(): ?string
    {
        return self::$academiaId;
    }

    /**
     * Retorna el academia_id o lanza excepción de seguridad si no está definido
     */
    public static function exigirAcademiaId(): string
    {
        if (self::$academiaId === null || trim(self::$academiaId) === '') {
            throw ExcepcionApi::accesoDenegado('Contexto de academia no establecido en la sesión.');
        }
        return self::$academiaId;
    }

    public static function limpiar(): void
    {
        self::$academiaId = null;
    }
}
