<?php

declare(strict_types=1);

namespace App\Core;

use InvalidArgumentException;
use DivisionByZeroError;

/**
 * Motor de Aritmética Decimal Fija (Fixed-Point Decimal).
 * Asegura cálculos monetarios en USD y VES con cero números flotantes.
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

    public static function add(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcadd(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '+', $scale);
    }

    public static function sub(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcsub(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '-', $scale);
    }

    public static function mul(string $a, string $b, int $scale = 2): string
    {
        if (self::checkBcmath()) {
            return bcmul(self::normalize($a), self::normalize($b), $scale);
        }
        return self::fallbackOp($a, $b, '*', $scale);
    }

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

    public static function normalize(string $num): string
    {
        $num = trim($num);
        if ($num === '') {
            return '0.00';
        }
        $num = str_replace(',', '.', $num);
        if (!preg_match('/^-?\d+(\.\d+)?$/', $num)) {
            throw new InvalidArgumentException("Formato decimal inválido: '{$num}'");
        }
        return $num;
    }

    private static function fallbackOp(string $a, string $b, string $op, int $scale): string
    {
        $a = self::normalize($a);
        $b = self::normalize($b);
        $factor = 10 ** $scale;

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
