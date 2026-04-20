<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TemplateFolder extends Model
{
    protected $table = 'm_template_folders';

    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'created_by',
        'updated_by',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TemplateFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(TemplateFolder::class, 'parent_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(ContractTemplate::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
