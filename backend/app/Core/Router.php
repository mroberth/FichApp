<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Enrutador HTTP ligero y modular para FichApp.
 * Soporta verbos REST, parámetros dinámicos en ruta ({id}), grupos y middlewares.
 */
class Router
{
    private static array $rutas = [];
    private static array $middlewaresAntes = [];
    private static string $prefijoGrupo = '';
    private static mixed $manejadorNoEncontrado = null;
    private static mixed $manejadorMetodoNoPermitido = null;

    public static function antes(array|string $metodos, string $patron, callable $manejador): void
    {
        self::$middlewaresAntes[] = [
            'metodos'   => is_array($metodos) ? $metodos : [$metodos],
            'patron'    => self::normalizarRuta(self::$prefijoGrupo . '/' . ltrim($patron, '/')),
            'manejador' => $manejador,
        ];
    }

    public static function grupo(string $prefijo, callable $callback): void
    {
        $anteriorPrefijo = self::$prefijoGrupo;
        self::$prefijoGrupo = rtrim($anteriorPrefijo, '/') . '/' . trim($prefijo, '/');

        $callback();

        self::$prefijoGrupo = $anteriorPrefijo;
    }

    public static function get(string $patron, callable $manejador): void
    {
        self::agregarRuta('GET', $patron, $manejador);
    }

    public static function post(string $patron, callable $manejador): void
    {
        self::agregarRuta('POST', $patron, $manejador);
    }

    public static function put(string $patron, callable $manejador): void
    {
        self::agregarRuta('PUT', $patron, $manejador);
    }

    public static function patch(string $patron, callable $manejador): void
    {
        self::agregarRuta('PATCH', $patron, $manejador);
    }

    public static function delete(string $patron, callable $manejador): void
    {
        self::agregarRuta('DELETE', $patron, $manejador);
    }

    public static function options(string $patron, callable $manejador): void
    {
        self::agregarRuta('OPTIONS', $patron, $manejador);
    }

    private static function agregarRuta(string $metodo, string $patron, callable $manejador): void
    {
        $rutaCompleta = self::normalizarRuta(self::$prefijoGrupo . '/' . ltrim($patron, '/'));

        self::$rutas[] = [
            'metodo'    => strtoupper($metodo),
            'patron'    => $rutaCompleta,
            'manejador' => $manejador,
        ];
    }

    public static function rutaNoEncontrada(callable $manejador): void
    {
        self::$manejadorNoEncontrado = $manejador;
    }

    public static function metodoNoPermitido(callable $manejador): void
    {
        self::$manejadorMetodoNoPermitido = $manejador;
    }

    public static function limpiar(): void
    {
        self::$rutas = [];
        self::$middlewaresAntes = [];
        self::$prefijoGrupo = '';
        self::$manejadorNoEncontrado = null;
        self::$manejadorMetodoNoPermitido = null;
    }

    /**
     * Despacha la petición actual o una simulada
     */
    public static function despachar(?string $metodo = null, ?string $uri = null): mixed
    {
        $metodoSolicitud = strtoupper($metodo ?? $_SERVER['REQUEST_METHOD'] ?? 'GET');
        $rutaSolicitada  = self::resolverRutaRelativa($uri ?? $_SERVER['REQUEST_URI'] ?? '/');

        // 1. Ejecutar middlewares aplicables
        self::ejecutarMiddlewares($metodoSolicitud, $rutaSolicitada);

        // 2. Buscar coincidencia de ruta
        $rutaCoincidente = false;
        $metodoCoincidente = false;

        foreach (self::$rutas as $ruta) {
            if (self::coincidePatron($ruta['patron'], $rutaSolicitada)) {
                $rutaCoincidente = true;

                if ($ruta['metodo'] === $metodoSolicitud || $ruta['metodo'] === 'ALL') {
                    $metodoCoincidente = true;

                    // Capturar parámetros {id} y colocarlos en $_GET
                    $params = self::capturarParametros($ruta['patron'], $rutaSolicitada);
                    foreach ($params as $clave => $valor) {
                        $_GET[$clave] = $valor;
                    }

                    // Ejecutar manejador y retornar su resultado
                    return call_user_func_array($ruta['manejador'], array_values($params));
                }
            }
        }

        // 3. Manejo de errores
        if (!$rutaCoincidente) {
            if (self::$manejadorNoEncontrado) {
                return call_user_func(self::$manejadorNoEncontrado);
            }
            throw new ExcepcionApi(ErrorCodes::RUTA_NO_ENCONTRADA, 404, "La ruta '{$rutaSolicitada}' no existe.");
        }

        if (!$metodoCoincidente) {
            if (self::$manejadorMetodoNoPermitido) {
                return call_user_func(self::$manejadorMetodoNoPermitido);
            }
            throw new ExcepcionApi(ErrorCodes::METODO_NO_PERMITIDO, 405, "Método '{$metodoSolicitud}' no permitido para esta ruta.");
        }

        return null;
    }

    private static function normalizarRuta(string $ruta): string
    {
        $limpia = trim($ruta, '/');
        return $limpia === '' ? '/' : $limpia;
    }

    private static function resolverRutaRelativa(string $uri): string
    {
        $ruta = parse_url($uri, PHP_URL_PATH) ?? '/';

        if (isset($_SERVER['SCRIPT_NAME'])) {
            $base = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
            if ($base !== '/' && str_starts_with($ruta, $base)) {
                $ruta = substr($ruta, strlen($base));
            }
        }

        return self::normalizarRuta($ruta);
    }

    private static function coincidePatron(string $patron, string $ruta): bool
    {
        if ($patron === $ruta) {
            return true;
        }

        // Convertir {param} en regex [^/]+
        $regex = preg_replace('/\{[^}]+\}/', '[^/]+', $patron);
        return (bool)preg_match("#^{$regex}$#", $ruta);
    }

    private static function capturarParametros(string $patron, string $ruta): array
    {
        $parametros = [];

        if (!preg_match_all('/\{([^}]+)\}/', $patron, $nombres)) {
            return $parametros;
        }

        $nombresClaves = $nombres[1];
        $regex = preg_replace('/\{[^}]+\}/', '([^/]+)', $patron);

        if (preg_match("#^{$regex}$#", $ruta, $coincidencias)) {
            array_shift($coincidencias);
            foreach ($nombresClaves as $index => $nombre) {
                if (isset($coincidencias[$index])) {
                    $parametros[$nombre] = $coincidencias[$index];
                }
            }
        }

        return $parametros;
    }

    private static function ejecutarMiddlewares(string $metodo, string $ruta): void
    {
        foreach (self::$middlewaresAntes as $middleware) {
            $metodos = $middleware['metodos'];
            $patron  = $middleware['patron'];

            if (in_array($metodo, $metodos, true) || in_array('ALL', $metodos, true)) {
                if ($patron === '.*' || $patron === '/' || self::coincidePatron($patron, $ruta)) {
                    call_user_func($middleware['manejador']);
                }
            }
        }
    }
}
