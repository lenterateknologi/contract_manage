<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContractFilterItem extends Model
{
    protected $table = 'm_contract_filter_items';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'filter_id',
        'type',  // company_group | region | company | division | department
        'value', // UUID organisasi tambahan
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function filter(): BelongsTo
    {
        return $this->belongsTo(ContractFilterSetting::class, 'filter_id');
    }
}
