<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\ContextoTenant;
use App\Core\ExcepcionApi;
use App\Core\Respuesta;
use App\DTOs\LoginDTO;
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RateLimitMiddleware;
use App\Services\AuthService;

/**
 * Controlador de Autenticación para FichApp.
 * Gestiona el inicio de sesión, perfil activo y cierre de sesión.
 */
class AuthController
{
    /**
     * Endpoint POST /api/v1/auth/login
     * Autentica con identificador y contraseña, emite token Bearer.
     */
    public static function login(): void
    {
        $cuerpo = file_get_contents('php://input');
        $datos = json_decode($cuerpo ?: '{}', true);

        if (!is_array($datos)) {
            throw ExcepcionApi::jsonInvalido('El cuerpo de la solicitud debe ser un objeto JSON válido.');
        }

        // Si se envió la cabecera X-Academia-Id y no vino en el body, se utiliza como fallback
        if (empty($datos['academia_id']) && !empty($_SERVER['HTTP_X_ACADEMIA_ID'])) {
            $datos['academia_id'] = trim($_SERVER['HTTP_X_ACADEMIA_ID']);
        }

        $dto = LoginDTO::desdeArray($datos);

        $ip = self::obtenerIpCliente();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        // Rate Limiting (Token Bucket): Máximo 5 intentos de ráfaga con recarga de 5 tokens cada 15 minutos (900 seg)
        // Se limita tanto por IP como por identificador de acceso
        $claveRateLimit = ($ip ?: 'unknown') . ':' . strtolower($dto->identificadorAcceso);
        RateLimitMiddleware::verificar('auth_login', $claveRateLimit, 5, 5 / 900);

        $authService = new AuthService();
        $resultado = $authService->login($dto, $ip, $userAgent);

        Respuesta::exito($resultado, 200);
    }

    /**
     * Endpoint GET /api/v1/auth/me
     * Retorna los datos del usuario autenticado, su rol y su academia.
     */
    public static function me(): void
    {
        AuthMiddleware::manejar();

        Respuesta::exito([
            'usuario' => Auth::usuario(),
        ], 200);
    }

    /**
     * Endpoint POST /api/v1/auth/logout
     * Revoca el token Bearer activo.
     */
    public static function logout(): void
    {
        AuthMiddleware::manejar();

        $token = Auth::token();
        if ($token !== null) {
            $authService = new AuthService();
            $authService->logout($token);
        }

        Auth::limpiar();
        ContextoTenant::limpiar();

        Respuesta::exito([
            'mensaje' => 'Sesión cerrada exitosamente.',
        ], 200);
    }

    private static function obtenerIpCliente(): ?string
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
        if ($ip !== null && str_contains($ip, ',')) {
            $partes = explode(',', $ip);
            return trim($partes[0]);
        }
        return $ip ? trim($ip) : null;
    }
}

/**
 * Funciones envoltorio de estilo procedural (DIRPOLES-4 / Arquitectura FichApp)
 */
function apiLogin(): void
{
    AuthController::login();
}

function apiMe(): void
{
    AuthController::me();
}

function apiLogout(): void
{
    AuthController::logout();
}
