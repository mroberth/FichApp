<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Services\AuthService;

/**
 * Middleware de Autenticación Bearer.
 * Extrae y valida el token HTTP de la cabecera Authorization,
 * e inicializa los contextos Auth y ContextoTenant.
 */
final class AuthMiddleware
{
    private static ?AuthService $authService = null;

    /**
     * Inyecta o configura el servicio de autenticación (útil para tests).
     */
    public static function setAuthService(?AuthService $authService): void
    {
        self::$authService = $authService;
    }

    /**
     * Extrae y valida el token Bearer en la petición actual.
     *
     * @throws ExcepcionApi Si el token no está presente o es inválido/expirado.
     */
    public static function manejar(): void
    {
        $token = self::extraerTokenBearer();

        if ($token === null || trim($token) === '') {
            throw ExcepcionApi::noAutenticado('Token de autenticación no suministrado en la cabecera Authorization.');
        }

        $service = self::$authService ?? new AuthService();
        $usuario = $service->validarToken($token);

        // Inicializar contextos en memoria para la petición actual
        Auth::iniciar($usuario, $token);
        ContextoTenant::setAcademiaId($usuario['academia_id']);
    }

    /**
     * Exige que el usuario esté autenticado y posea uno de los roles autorizados.
     *
     * @param string ...$rolesPermitidos Lista de roles permitidos (ej. 'administrador', 'superadmin')
     * @throws ExcepcionApi
     */
    public static function exigirRol(string ...$rolesPermitidos): void
    {
        self::manejar();

        if (!Auth::tieneRol(...$rolesPermitidos)) {
            throw ExcepcionApi::accesoDenegado('No tienes permisos suficientes para realizar esta acción.');
        }
    }

    /**
     * Extrae el token Bearer desde los diferentes orígenes de cabeceras de PHP.
     */
    public static function extraerTokenBearer(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? null;

        if ($header === null && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if ($header === null) {
            return null;
        }

        $header = trim($header);

        if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}
