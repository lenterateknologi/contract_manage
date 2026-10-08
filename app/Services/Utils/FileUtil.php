<?php

namespace App\Services\Utils;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUtil
{
    /**
     * Safely get the size of a stored file in bytes, or null if file does not exist.
     */
    public static function size(?string $path, string $disk = 'local'): ?int
    {
        if (! $path) {
            return null;
        }

        try {
            return Storage::disk($disk)->exists($path) ? Storage::disk($disk)->size($path) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Resolve the readable attachment name from mapped attachment paths or fallback to basename.
     */
    public static function resolveName(?string $path, array $attachmentMap = []): ?string
    {
        if (! $path) {
            return null;
        }

        return $attachmentMap[$path] ?? basename($path);
    }

    /**
     * Generate a sanitized PDF file name.
     */
    public static function generatePdfName(string $prefix, ?string $documentNo, ?string $suffix = null): string
    {
        $safeNo = Str::slug($documentNo ?: 'document');
        $timestamp = time();

        if ($suffix) {
            return "{$prefix}_{$safeNo}_{$suffix}_{$timestamp}.pdf";
        }

        return "{$prefix}_{$safeNo}_{$timestamp}.pdf";
    }
}
