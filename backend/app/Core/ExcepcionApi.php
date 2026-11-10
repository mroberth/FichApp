<?php

declare(strict_types=1);

namespace App\Core;

use Exception;

/**
 * La ÚNICA clase de excepción de negocio del sistema FichApp.
 * Transporta código de error estable, estado HTTP real, mensaje en español y detalles opcionales.
 */
class ExcepcionApi extends Exception
{
    public readonly string $codigo;
    public readonly int $estado;
    /** @var array<string,mixed>|null Detalles opcionales (ej: errores por campo). */
    public readonly ?array $detalles;

    public function __construct(string $codigo, int $estado, string $mensaje, ?array $detalles = null)
    {
        parent::__construct($mensaje);
        $this->codigo   = $codigo;
        $this->estado   = $estado;
        $this->detalles = $detalles;
    }

    // ---------- Fábricas estáticas para errores comunes ----------

    /** 400 — Datos inválidos, incompletos o con formato incorrecto. */
    public static function validacion(string $mensaje, ?array $detalles = null): self
    {
        return new self(ErrorCodes::VALIDACION, 400, $mensaje, $detalles);
    }

    /** 400 — El cuerpo de la solicitud no es JSON válido. */
    public static function jsonInvalido(string $mensaje = 'El cuerpo de la solicitud no es un JSON válido.'): self
    {
        return new self(ErrorCodes::JSON_INVALIDO, 400, $mensaje);
    }

    /** 404 — El recurso consultado no existe. */
    public static function noEncontrado(string $mensaje = 'El recurso solicitado no existe.'): self
    {
        return new self(ErrorCodes::NO_ENCONTRADO, 404, $mensaje);
    }

    /** 409 — El registro ya existe (duplicado o idempotencia). */
    public static function yaExiste(string $mensaje): self
    {
        return new self(ErrorCodes::YA_EXISTE, 409, $mensaje);
    }

    /** 409 — El registro no puede eliminarse porque tiene dependencias. */
    public static function enUso(string $mensaje): self
    {
        return new self(ErrorCodes::EN_USO, 409, $mensaje);
    }

    /** 401 — No autenticado. */
    public static function noAutenticado(string $mensaje = 'Debes iniciar sesión para continuar.'): self
    {
        return new self(ErrorCodes::NO_AUTENTICADO, 401, $mensaje);
    }

    /** 403 — Autenticado pero sin permiso o academia ajena (Multi-tenant). */
    public static function accesoDenegado(string $mensaje = 'No tienes permiso para realizar esta acción.'): self
    {
        return new self(ErrorCodes::ACCESO_DENEGADO, 403, $mensaje);
    }

    /** 429 — Límite de peticiones excedido (Token Bucket / Rate Limiting). */
    public static function demasiadasPeticiones(string $mensaje = 'Demasiadas solicitudes. Por favor espera antes de intentar nuevamente.', ?array $detalles = null): self
    {
        return new self(ErrorCodes::DEMASIADAS_PETICIONES, 429, $mensaje, $detalles);
    }

    /** 500 — Fallo técnico inesperado. */
    public static function errorInterno(string $mensaje = 'Ocurrió un error inesperado en el servidor.'): self
    {
        return new self(ErrorCodes::ERROR_INTERNO, 500, $mensaje);
    }
}
