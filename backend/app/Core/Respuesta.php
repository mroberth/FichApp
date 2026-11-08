<?php

declare(strict_types=1);

namespace App\Core;

use Throwable;

/**
 * El ÚNICO punto por donde sale JSON del sistema FichApp.
 *
 * Contrato JSON estándar:
 *   Éxito:  { "exito": true,  "datos": <cualquier cosa> }
 *   Error:  { "exito": false, "error": { "codigo": "...", "estado": 400, "mensaje": "..." } }
 */
final class Respuesta
{
    /** Responde JSON de éxito y TERMINA la ejecución. */
    public static function exito(mixed $datos = null, int $estado = 200): never
    {
        self::json(['exito' => true, 'datos' => $datos], $estado);
    }

    /** Responde JSON de error y TERMINA la ejecución. */
    public static function error(Throwable $e): never
    {
        if ($e instanceof ExcepcionApi) {
            $error = [
                'codigo'  => $e->codigo,
                'estado'  => $e->estado,
                'mensaje' => $e->getMessage(),
            ];
            if ($e->detalles !== null) {
                $error['detalles'] = $e->detalles;
            }
            self::json(['exito' => false, 'error' => $error], $e->estado);
        }

        // Error técnico no controlado
        error_log('ERROR NO CONTROLADO (' . get_class($e) . '): ' . $e->getMessage()
            . ' en ' . $e->getFile() . ':' . $e->getLine());

        $debug = Env::get('APP_DEBUG', false);
        $mensaje = ($debug === true || $debug === 'true')
            ? $e->getMessage()
            : 'Ocurrió un error inesperado en el servidor.';

        self::json([
            'exito' => false,
            'error' => [
                'codigo'  => ErrorCodes::ERROR_INTERNO,
                'estado'  => 500,
                'mensaje' => $mensaje
            ],
        ], 500);
    }

    /** Emite JSON con cabeceras y finaliza. */
    private static function json(array $payload, int $estado): never
    {
        if (!headers_sent()) {
            http_response_code($estado);
            header('Content-Type: application/json; charset=utf-8');
            header('X-Content-Type-Options: nosniff');
        }

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
