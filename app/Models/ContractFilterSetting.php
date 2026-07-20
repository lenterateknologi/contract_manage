<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ContractFilterSetting extends Model
{
    use SoftDeletes;

    protected $table = 'm_contract_filter';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'type',
        'reference_id',
        'can_change_company_group',
        'can_change_region',
        'can_change_company',
        'can_change_division',
        'can_change_department',
    ];

    protected $with = ['items'];

    protected function casts(): array
    {
        return [
            'can_change_company_group' => 'boolean',
            'can_change_region' => 'boolean',
            'can_change_company' => 'boolean',
            'can_change_division' => 'boolean',
            'can_change_department' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // ── Relations ──────────────────────────────────────────────

    public function items(): HasMany
    {
        return $this->hasMany(ContractFilterItem::class, 'filter_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reference_id');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'reference_id');
    }

    // ── Helpers ─────────────────────────────────────────────────

    /**
     * Ambil semua value untuk satu type sebagai array UUID bersih.
     * Secara otomatis memecah format lama "uuid|uuid" dan memfilter token non-UUID.
     */
    public function getItemValues(string $type): array
    {
        return $this->items
            ->where('type', $type)
            ->pluck('value')
            ->flatMap(function (string $value) {
                // Pecah format lama "uuid|uuid" menjadi individual
                return str_contains($value, '|') ? explode('|', $value) : [$value];
            })
            ->map(function ($v) {
                // ponytail: hapus prefix g_, r_, c_ untuk kompatibilitas UUID
                return preg_replace('/^(g|r|c)_/', '', trim($v));
            })
            ->filter(fn ($v) => ! empty($v) && $v !== '[USER_LOGIN]' && $v !== 'null')
            ->unique()
            ->values()
            ->all();
    }

    /** Sync items untuk satu type (replace all) */
    public function syncItems(string $type, array $values): void
    {
        // Hapus yang lama
        $this->items()->where('type', $type)->delete();

        // Insert yang baru
        $now = now();
        $rows = array_map(fn ($v) => [
            'id' => (string) Str::uuid(),
            'filter_id' => $this->id,
            'type' => $type,
            'value' => $v,
            'created_at' => $now,
            'updated_at' => $now,
        ], array_filter($values, fn ($v) => ! empty($v)));

        if (! empty($rows)) {
            ContractFilterItem::insert($rows);
        }

        // Refresh relasi agar query selanjutnya dapat data terbaru
        $this->unsetRelation('items');
        $this->load('items');
    }

    /** Shortcut getter per tipe */
    public function getAllowedByType(string $type): array
    {
        return $this->getItemValues($type);
    }
}
