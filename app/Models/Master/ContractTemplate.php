<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractTemplate extends Model
{
    protected $table = 'm_contract_templates';

    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'template_folder_id',
        'name',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'file_type',
        'is_visible',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_visible' => 'boolean',
    ];

    public function folder(): BelongsTo
    {
        return $this->belongsTo(TemplateFolder::class, 'template_folder_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
