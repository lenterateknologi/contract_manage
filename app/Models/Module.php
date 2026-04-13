<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Module extends Model
{
    use HasFactory;

    protected $table = 'modules';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'title',
        'sort_number',
        'url',
        'icon',
        'module_group_id',
        'showed_as_menu',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'showed_as_menu' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function moduleGroup(): BelongsTo
    {
        return $this->belongsTo(ModuleGroup::class, 'module_group_id');
    }

    public function accessModules(): HasMany
    {
        return $this->hasMany(AccessModule::class, 'module_id');
    }
}
