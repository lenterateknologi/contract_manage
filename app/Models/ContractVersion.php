<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractVersion extends Model
{
    protected $table = 't_contract_versions';

    use HasUuids, SoftDeletes;
    protected $fillable = [
        'contract_id',
        'document_type',
        'version_no',
        'file_name',
        'file_path',
        'change_log',
        'uploaded_by',
        'is_final',
        'file_hash',
    ];

    protected $casts = [
        'is_final' => 'boolean',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
