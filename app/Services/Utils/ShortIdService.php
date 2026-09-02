<?php

namespace App\Services\Utils;

class ShortIdService
{
    /**
     * Check if short URL encoding is enabled in config/env.
     */
    public static function isEnabled(): bool
    {
        return (bool) config('app.short_url_enabled', false);
    }

    /**
     * Encode a UUID or string into a short URL-safe ID.
     */
    public static function encode(?string $uuid): ?string
    {
        if (! $uuid) {
            return null;
        }

        if (! self::isEnabled()) {
            return $uuid;
        }

        // Clean UUID
        $clean = str_replace('-', '', trim($uuid));
        if (strlen($clean) !== 32 || ! ctype_xdigit($clean)) {
            return $uuid;
        }

        try {
            $bin = hex2bin($clean);

            return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
        } catch (\Throwable) {
            return $uuid;
        }
    }

    /**
     * Decode a short ID back into standard UUID format (or return as-is if already a UUID).
     */
    public static function decode(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        $trimmed = trim($value);

        // Check if already a valid UUID format (8-4-4-4-12)
        if (preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $trimmed)) {
            return strtolower($trimmed);
        }

        // Decode 22-character base64url string
        try {
            $b64 = strtr($trimmed, '-_', '+/');
            // Add padding if missing
            $pad = strlen($b64) % 4;
            if ($pad > 0) {
                $b64 .= str_repeat('=', 4 - $pad);
            }

            $bin = base64_decode($b64, true);
            if (! $bin || strlen($bin) !== 16) {
                return $trimmed;
            }

            $hex = bin2hex($bin);
            if (strlen($hex) !== 32) {
                return $trimmed;
            }

            return strtolower(sprintf(
                '%08s-%04s-%04s-%04s-%12s',
                substr($hex, 0, 8),
                substr($hex, 8, 4),
                substr($hex, 12, 4),
                substr($hex, 16, 4),
                substr($hex, 20, 12)
            ));
        } catch (\Throwable) {
            return $trimmed;
        }
    }
}
