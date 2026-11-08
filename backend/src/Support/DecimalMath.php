<?php

declare(strict_types=1);

namespace FichApp\Support;

use InvalidArgumentException;
use DivisionByZeroError;

/**
 * Motor de Aritmética Decimal Exacta (Fixed-Point Decimal).
 * Evita cualquier uso de tipos flotantes IEEE 754 para cálculos financieros.
 * Utiliza la extensión nativa bcmath si está instalada, o un motor puro de cadenas de alta precisión.
 */
final class DecimalMath
{
    private static ?bool $hasBcmath = null;

    private static function checkBcmath(): bool
    {
        if (self::$hasBcmath === null) {
            self::$hasBcmath = function_exists('bcadd');
        }
        return self::$hasBcmath;
    }

    /**
     * Suma dos montos decimales con escala fija
     */
    public static function add(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcadd(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '+', $scale);
    }

    /**
     * Resta dos montos decimales ($a - $b)
     */
    public static function sub(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcsub(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '-', $scale);
    }

    /**
     * Multiplica dos montos decimales
     */
    public static function mul(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcmul(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '*', $scale);
    }

    /**
     * Divide dos montos decimales ($a / $b)
     */
    public static function div(string $a, string $b, int $scale = 2): string
    {
        $bNorm = self::normalize($b);
        if (self::comp($bNorm, '0.00', $scale) === 0) {
            throw new DivisionByZeroError("División por cero en cálculo monetario.");
        }

        if (self::checkBcmath()) {
            return bcdiv(self::normalize($a), $bNorm, $scale);
        }
        return self::fallbackOp($a, $b, '/', $scale);
    }

    /**
     * Compara dos montos decimales:
     * Retorna 0 si son iguales, 1 si $a > $b, -1 si $a < $b
     */
    public static function comp(string $a, string $b, int $scale = 2): int
    {
        if (self::checkBcmath()) {
            return bccomp(self::normalize($a), self::normalize($b), $scale);
        }
        $diff = self::sub($a, $b, $scale);
        $val = rtrim(rtrim($diff, '0'), '.');
        if ($val === '' || $val === '-0' || $val === '0') {
            return 0;
        }
        return str_starts_with($val, '-') ? -1 : 1;
    }

    /**
     * Normaliza el formato de un número decimal en cadena
     */
    public static function normalize(string $num): string
    {
        $num = trim($num);
        if ($num === '') {
            return '0.00';
        }
        // Reemplazar coma por punto si viene en formato europeo/latam
        $num = str_replace(',', '.', $num);
        if (!preg_match('/^-?\d+(\.\d+)?$/', $num)) {
            throw new InvalidArgumentException("Formato decimal inválido: '{$num}'");
        }
        return $num;
    }

    /**
     * Implementación pura en enteros escalados si bcmath no está compilado
     */
    private static function fallbackOp(string $a, string $b, string $op, int $scale): string
    {
        $a = self::normalize($a);
        $b = self::normalize($b);

        // Multiplicador de escala
        $factor = 10 ** $scale;

        // Convertir a enteros escalados
        $aParts = explode('.', $a);
        $bParts = explode('.', $b);

        $aInt = (int)$aParts[0] * $factor + (int)substr(($aParts[1] ?? '') . str_repeat('0', $scale), 0, $scale);
        if (str_starts_with($aParts[0], '-')) {
            $aInt = -abs($aInt);
        }

        $bInt = (int)$bParts[0] * $factor + (int)substr(($bParts[1] ?? '') . str_repeat('0', $scale), 0, $scale);
        if (str_starts_with($bParts[0], '-')) {
            $bInt = -abs($bInt);
        }

        $resultInt = match ($op) {
            '+' => $aInt + $bInt,
            '-' => $aInt - $bInt,
            '*' => (int)intdiv($aInt * $bInt, $factor),
            '/' => (int)intdiv($aInt * $factor, $bInt),
            default => throw new InvalidArgumentException("Operación no soportada: {$op}"),
        };

        $isNegative = $resultInt < 0;
        $absResult = abs($resultInt);
        $entero = intdiv($absResult, $factor);
        $decimal = str_pad((string)($absResult % $factor), $scale, '0', STR_PAD_LEFT);

        return ($isNegative ? '-' : '') . "{$entero}.{$decimal}";
    }
}
