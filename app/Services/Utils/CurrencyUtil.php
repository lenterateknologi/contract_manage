<?php

namespace App\Services\Utils;

class CurrencyUtil
{
    /**
     * Parse any formatted currency string (Indonesian or international) into a clean float value.
     */
    public static function parse(?string $amount): float
    {
        if (empty($amount)) {
            return 0.0;
        }

        $clean = preg_replace('/[^\d.,]/', '', $amount);
        $hasDot = str_contains($clean, '.');
        $hasComma = str_contains($clean, ',');

        if ($hasDot && $hasComma) {
            if (strpos($clean, '.') < strpos($clean, ',')) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasComma) {
            if (preg_match('/,\d{2}$/', $clean)) {
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($hasDot) {
            if (substr_count($clean, '.') > 1) {
                $clean = str_replace('.', '', $clean);
            } elseif (preg_match('/\.\d{3}$/', $clean)) {
                $clean = str_replace('.', '', $clean);
            }
        }

        return (float) $clean;
    }

    /**
     * Format a numeric amount to a standard currency string.
     */
    public static function format(float|int|string|null $amount, string $currency = 'IDR', int $decimals = 0): string
    {
        $num = is_numeric($amount) ? (float) $amount : self::parse((string) $amount);

        if ($currency === 'IDR') {
            return 'Rp '.number_format($num, $decimals, ',', '.');
        }

        return $currency.' '.number_format($num, $decimals, '.', ',');
    }
}
