<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContractAttachment extends Model
{
    protected $table = 't_attachments';

    use HasUuids, SoftDeletes;

    protected $fillable = [
        'contract_id',
        'label',
        'category',
        'file_name',
        'file_path',
        'file_type',
        'uploaded_by',
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
