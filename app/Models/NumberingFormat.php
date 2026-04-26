<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class NumberingFormat extends Model
{
    use HasUuids;

    protected $table = 'm_numbering_formats';

    protected $fillable = [
        'module',
        'format_pattern',
        'current_number',
        'padding',
        'is_active',
    ];

    public static function generateNextNumber(string $module, array $context = []): string
    {
        $format = self::where('module', $module)->where('is_active', true)->first();
        if (!$format) {
            return strtoupper($module) . '-' . date('Y') . '-' . strtoupper(\Illuminate\Support\Str::random(5));
        }

        $format->increment('current_number');
        $pattern = $format->format_pattern;

        $replacements = [
            '{{nomor}}' => str_pad($format->current_number, $format->padding, '0', STR_PAD_LEFT),
            '{{tanggal}}' => date('d'),
            '{{bulan}}' => date('m'),
            '{{tahun}}' => date('Y'),
            '{{CMS}}' => 'CMS',
            '{{kode_departemen}}' => $context['kode_departemen'] ?? 'GEN',
            '{{kode_perjanjian}}' => $context['kode_perjanjian'] ?? 'KTR',
        ];

        foreach ($replacements as $key => $value) {
            $pattern = str_replace($key, $value, $pattern);
        }

        return $pattern;
    }
}
