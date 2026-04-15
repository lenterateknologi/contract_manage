<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'template_folder_id',
        'name',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'file_type',
        'created_by',
        'updated_by',
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
