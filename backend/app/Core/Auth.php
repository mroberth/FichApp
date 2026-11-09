<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Gestor de contexto de Autenticación para el ciclo de vida de la petición actual.
 * Proporciona acceso al usuario autenticado, roles y token activo.
 */
final class Auth
{
    private static ?array $usuario = null;
    private static ?string $token = null;

    /**
     * Establece el usuario y token autenticados para la solicitud.
     *
     * @param array<string, mixed> $usuario
     */
    public static function iniciar(array $usuario, string $token): void
    {
        self::$usuario = $usuario;
        self::$token = $token;
    }

    /**
     * Retorna todos los datos del usuario autenticado en sesión, o null si no hay sesión.
     *
     * @return array<string, mixed>|null
     */
    public static function usuario(): ?array
    {
        return self::$usuario;
    }

    /**
     * Retorna el UUID del usuario autenticado.
     */
    public static function usuarioId(): ?string
    {
        return self::$usuario['id'] ?? self::$usuario['usuario_id'] ?? null;
    }

    /**
     * Retorna el UUID de la academia a la que pertenece el usuario.
     */
    public static function academiaId(): ?string
    {
        return self::$usuario['academia_id'] ?? null;
    }

    /**
     * Retorna el rol del usuario autenticado (superadmin, administrador, entrenador).
     */
    public static function rol(): ?string
    {
        return self::$usuario['rol'] ?? self::$usuario['usuario_rol'] ?? null;
    }

    /**
     * Retorna el token Bearer en texto plano de la solicitud actual.
     */
    public static function token(): ?string
    {
        return self::$token;
    }

    /**
     * Indica si hay una sesión activa en la petición.
     */
    public static function estaAutenticado(): bool
    {
        return self::$usuario !== null;
    }

    /**
     * Retorna true si el usuario tiene rol superadmin.
     */
    public static function esSuperAdmin(): bool
    {
        return self::rol() === 'superadmin';
    }

    /**
     * Retorna true si el usuario es administrador (o superadmin).
     */
    public static function esAdmin(): bool
    {
        $rol = self::rol();
        return $rol === 'superadmin' || $rol === 'administrador';
    }

    /**
     * Retorna true si el usuario tiene rol entrenador.
     */
    public static function esEntrenador(): bool
    {
        return self::rol() === 'entrenador';
    }

    /**
     * Verifica si el usuario autenticado tiene al menos uno de los roles indicados.
     */
    public static function tieneRol(string ...$roles): bool
    {
        $rolActual = self::rol();
        return $rolActual !== null && in_array($rolActual, $roles, true);
    }

    /**
     * Limpia la información de autenticación de memoria.
     */
    public static function limpiar(): void
    {
        self::$usuario = null;
        self::$token = null;
    }
}
