<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Registro central de códigos de error del sistema FichApp.
 * Las constantes son estables para que el frontend (React Native) programe contra ellas.
 */
final class ErrorCodes
{
    // ---- Errores Generales ----
    public const VALIDACION          = 'VALIDATION_ERROR';       // 400 — datos inválidos o incompletos
    public const JSON_INVALIDO       = 'INVALID_JSON';           // 400 — cuerpo no es JSON válido
    public const NO_ENCONTRADO       = 'NOT_FOUND';              // 404 — recurso inexistente
    public const RUTA_NO_ENCONTRADA  = 'ROUTE_NOT_FOUND';        // 404 — endpoint no registrado
    public const METODO_NO_PERMITIDO = 'METHOD_NOT_ALLOWED';     // 405 — verbo HTTP incorrecto
    public const YA_EXISTE           = 'ALREADY_EXISTS';         // 409 — registro duplicado (idempotencia o unicidad)
    public const EN_USO              = 'IN_USE';                 // 409 — no se puede eliminar (dependencias)
    public const ERROR_INTERNO       = 'INTERNAL_SERVER_ERROR';  // 500 — fallo técnico no controlado

    // ---- Autenticación y Autorización ----
    public const NO_AUTENTICADO      = 'UNAUTHENTICATED';        // 401 — sin token o sesión
    public const ACCESO_DENEGADO     = 'ACCESS_DENIED';          // 403 — sin permiso de rol o academia ajena
    public const TOKEN_EXPIRADO      = 'TOKEN_EXPIRED';          // 401 — token expirado
    public const TOKEN_INVALIDO      = 'TOKEN_INVALID';          // 401 — firma o token malformado

    // ---- Negocio Financiero (FichApp) ----
    public const TASA_NO_DISPONIBLE  = 'EXCHANGE_RATE_NOT_FOUND'; // 400 — no hay tasa BCV para la fecha
    public const PRONTO_PAGO_VENCIDO = 'EARLY_BIRD_EXPIRED';      // 400 — venció el plazo de pronto-pago
    public const IMPUTACION_INVALIDA = 'INVALID_ALLOCATION';      // 400 — el monto imputado no coincide

    private function __construct() {}
}
